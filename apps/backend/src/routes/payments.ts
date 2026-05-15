import express from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getPaymentProvider } from '../services/payments/index.js';
import { ah } from '../utils/asyncHandler.js';
import { createNotification, notifyEmail } from '../services/notifications.js';


export const router = Router();

router.post('/checkout', requireAuth, ah(async (req: any, res) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, buyer: true } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyerId !== req.user!.sub && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  if (order.paymentMethod !== 'ONLINE') return res.status(400).json({ error: 'Not an online payment' });

  await prisma.payment.upsert({
    where: { orderId },
    create: { orderId, provider: (process.env.PAYMENT_PROVIDER || 'payhere'), method: 'card', amount: order.total, status: 'INITIATED' },
    update: {}
  });
  const provider = getPaymentProvider();
  const session = await provider.createCheckoutSession(order);
  res.json(session);
}));

// PayHere IPN (urlencoded)
router.post('/webhook/payhere', express.urlencoded({ extended: false }), ah(async (req, res) => {
  const provider = getPaymentProvider('payhere');
  try {
    const event = await provider.verifyWebhook(req);
    await handlePaymentEvent(event);
    return res.json({ received: true });
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
}));

// WebXpay IPN (urlencoded)
router.post('/webhook/webxpay', express.urlencoded({ extended: false }), ah(async (req, res) => {
  const provider = getPaymentProvider('webxpay');
  try {
    const event = await provider.verifyWebhook(req);
    await handlePaymentEvent(event);
    return res.json({ received: true });
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
}));

// Stripe webhook (raw body)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), ah(async (req, res) => {
  const provider = getPaymentProvider('stripe');
  try {
    const event = await provider.verifyWebhook(req);
    await handlePaymentEvent(event);
    return res.json({ received: true });
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
}));

// Optional generic JSON webhook (dev)
router.post('/webhook', ah(async (req, res) => {
  const provider = getPaymentProvider();
  try {
    const event = await provider.verifyWebhook(req);
    await handlePaymentEvent(event);
    return res.json({ received: true });
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
}));

// DEBUG: Simulate payment success (DEV ONLY)
router.post('/simulate-success', ah(async (req, res) => {
  try {
    const { orderId, donationRequestId } = z.object({ 
      orderId: z.string().optional(),
      donationRequestId: z.string().optional()
    }).parse(req.body);
    
    let targetId = orderId;

    // If donationRequestId is provided, find the latest INITIATED donation for it
    if (donationRequestId && !targetId) {
      const latestPending = await prisma.donation.findFirst({
        where: { donationRequestId, status: 'INITIATED' },
        orderBy: { createdAt: 'desc' }
      });
      if (!latestPending) {
        return res.status(404).json({ error: 'No pending donations found for this request. Please click "Donate" first.' });
      }
      targetId = latestPending.id;
    }

    if (!targetId) return res.status(400).json({ error: 'Missing orderId or donationRequestId' });

    await handlePaymentEvent({
      type: 'payment.succeeded',
      orderId: targetId,
      txnRef: 'SIMULATED_' + Date.now(),
      amount: 0,
      raw: { simulated: true }
    });
    
    res.json({ success: true, message: 'Simulated payment success' });
  } catch (err: any) {
    console.error('Simulation Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}));

async function handlePaymentEvent(event: any) {
  console.log('--- HANDLING PAYMENT EVENT ---', event.type, event.orderId);
  if (event.type === 'payment.succeeded') {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Check if it's a regular Order
        const order = await tx.order.findUnique({ where: { id: event.orderId }, include: { items: true } });
        console.log('Order lookup:', !!order);
        
        if (order) {
          console.log('Current order status:', order.status);
          if (order.status === 'AWAITING_PAYMENT' || order.status === 'CREATED' || order.status === 'RESERVED') {
            console.log('Processing payment success for order...');
            await tx.payment.upsert({
              where: { orderId: order.id },
              create: { orderId: order.id, provider: process.env.PAYMENT_PROVIDER || 'payhere', method: 'card', amount: order.total, status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any },
              update: { status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any }
            });

            for (const item of order.items) {
              console.log(`Updating stock for listing ${item.listingId}, qty: ${item.qty}`);
              try {
                const updatedListing = await tx.listing.update({ 
                  where: { id: item.listingId },
                  data: { qtyAvailable: { decrement: item.qty } } 
                });
                console.log(`New stock for ${item.listingId}: ${updatedListing.qtyAvailable}`);
              } catch (stockErr: any) {
                console.error(`Stock update failed for item ${item.listingId}:`, stockErr.message);
                throw new Error(`Insufficient stock or listing not found: ${item.listingId}`);
              }
            }
            
            await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
            console.log('Order status updated to PAID');

            // Notify customer
            try {
              const buyer = await tx.user.findUnique({ where: { id: order.buyerId } });
              if (buyer) {
                const message = `Payment successful for Order #${order.id}.`;
                await createNotification(buyer.id, 'PAYMENT_SUCCESS', 'IN_APP', { orderId: order.id, message, action: 'VIEW_ORDER' });
                
                const io = (global as any).__io;
                if (io) io.to(`user:${buyer.id}`).emit('notification', { type: 'PAYMENT_SUCCESS', message, orderId: order.id });

                await notifyEmail(buyer.email, `Payment Received: Order #${order.id}`, `<h1>Thank you!</h1><p>Received LKR ${Number(order.total).toFixed(2)}</p>`);
              }

              // NEW: Notify Provider about the new order
              const provider = await tx.user.findUnique({ where: { id: order.providerId } });
              if (provider) {
                const message = `New Order Received! Order #${order.id}.`;
                await createNotification(order.providerId, 'NEW_ORDER', 'IN_APP', { 
                  orderId: order.id, 
                  message,
                  action: 'VIEW_ORDER_DETAIL'
                });

                const io = (global as any).__io;
                if (io) {
                  io.to(`user:${order.providerId}`).emit('notification', { 
                    type: 'NEW_ORDER', 
                    message, 
                    orderId: order.id 
                  });
                }
              }
            } catch (notifyErr) {
              console.error('Notification failed but payment was processed:', notifyErr);
            }
          } else {
            console.log('Order is not in a state that allows payment update.');
          }
          return;
        }

        // 2. Check if it's a Donation
        const donation = await tx.donation.findUnique({ 
          where: { id: event.orderId },
          include: { donationRequest: true }
        });
        console.log('Donation lookup:', !!donation);
        
        if (donation) {
          if (donation.status === 'INITIATED') {
            const updatedDonation = await tx.donation.update({
              where: { id: donation.id },
              data: { status: 'SUCCEEDED', stripePaymentId: event.txnRef }
            });

            const listing = await tx.listing.findUnique({ where: { id: donation.donationRequest.listingId || '' } });
            const price = listing ? Number(listing.discountPrice) : 0;
            const qtyDonated = price > 0 ? Math.floor(Number(donation.amount) / price) : 0;

            // Immediate stock decrement per donation
            if (listing && qtyDonated > 0) {
               await tx.listing.update({ 
                 where: { id: listing.id }, 
                 data: { qtyAvailable: { decrement: Math.min(listing.qtyAvailable, qtyDonated) } } 
               });
               console.log(`Decremented ${qtyDonated} units from listing ${listing.id} for donation ${donation.id}`);
            }

            const updatedRequest = await tx.donationRequest.update({
              where: { id: donation.donationRequestId },
              data: {
                raisedAmount: { increment: donation.amount },
                fulfilledQty: { increment: qtyDonated },
                donorCount: { increment: 1 }
              },
              include: {
                center: { include: { user: true } },
                donations: { where: { status: 'SUCCEEDED' }, include: { customer: true } }
              }
            });

            console.log(`Donation ${donation.id} marked as SUCCEEDED. New raised amount: ${updatedRequest.raisedAmount}`);

            // Check if target reached
            if (Number(updatedRequest.raisedAmount) >= Number(updatedRequest.targetAmount) && updatedRequest.status === 'OPEN') {
              await tx.donationRequest.update({ where: { id: updatedRequest.id }, data: { status: 'FULFILLED' } });

              if (updatedRequest.listingId) {
                const listing = await tx.listing.findUnique({ where: { id: updatedRequest.listingId } });
                if (listing) {
                  const price = Number(listing.discountPrice);
                  const totalQty = Math.floor(Number(updatedRequest.raisedAmount) / price);
                  
                  await tx.order.create({
                    data: {
                      buyerId: updatedRequest.centerId,
                      providerId: listing.providerId,
                      type: 'DONATION',
                      fulfillmentMode: 'PICKUP',
                      paymentMethod: 'ONLINE',
                      status: 'PAID',
                      donationCenterId: updatedRequest.centerId,
                      donationRequestId: updatedRequest.id,
                      subtotal: price * totalQty,
                      total: price * totalQty,
                      items: {
                        create: {
                          listingId: listing.id,
                          providerId: listing.providerId,
                          qty: totalQty,
                          unitPrice: price,
                          snapshotExpiresAt: listing.expiresAt
                        }
                      }
                    }
                  });
                  // Note: Stock was already decremented incrementally above, so we don't decrement again here.
                  console.log(`Final fulfilled order created for donation request ${updatedRequest.id}`);
                }
              }
            }
          }
          return;
        }

        throw new Error('Transaction ID not found in orders or donations');
      });
    } catch (err) {
      console.error('CRITICAL: Payment handling failed:', err);
      throw err;
    }
  } else {
    const orderId = (event as any).orderId;
    if (orderId) {
      console.log('Handling payment failure for order:', orderId);
      await prisma.payment.updateMany({ where: { orderId }, data: { status: 'FAILED' } });
      await prisma.order.updateMany({ where: { id: orderId, status: 'AWAITING_PAYMENT' }, data: { status: 'CANCELED' } });
    }
  }
}
