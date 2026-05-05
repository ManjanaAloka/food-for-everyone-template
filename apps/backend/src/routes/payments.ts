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
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  
  // Only allow in development
  // if (process.env.NODE_ENV !== 'development') return res.status(403).json({ error: 'Only allowed in dev' });

  await handlePaymentEvent({
    type: 'payment.succeeded',
    orderId,
    txnRef: 'SIMULATED_' + Date.now(),
    amount: 0, // Not used for update
    raw: { simulated: true }
  });
  
  res.json({ success: true, message: 'Simulated payment success' });
}));

async function handlePaymentEvent(event: any) {
  if (event.type === 'payment.succeeded') {
    await prisma.$transaction(async (tx) => {
      // 1. Check if it's a regular Order
      const order = await tx.order.findUnique({ where: { id: event.orderId }, include: { items: true } });
      if (order) {
        if (order.status === 'AWAITING_PAYMENT') {
          await tx.payment.upsert({
            where: { orderId: order.id },
            create: { orderId: order.id, provider: process.env.PAYMENT_PROVIDER || 'payhere', method: 'card', amount: order.total, status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any },
            update: { status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any }
          });
          for (const item of order.items) {
            const updated = await tx.listing.updateMany({ where: { id: item.listingId, qtyAvailable: { gte: item.qty }, status: 'ACTIVE' }, data: { qtyAvailable: { decrement: item.qty } } });
            if (updated.count !== 1) throw new Error('Stock decrement failed');
          }
          await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });

          // Notify customer
          const buyer = await tx.user.findUnique({ where: { id: order.buyerId } });
          if (buyer) {
            await createNotification(buyer.id, 'PAYMENT_SUCCESS', 'IN_APP', { 
              orderId: order.id, 
              message: `Payment successful for Order #${order.id}.`,
              action: 'VIEW_ORDER'
            });
            await notifyEmail(buyer.email, `Payment Received: Order #${order.id}`, `<h1>Thank you!</h1><p>Received LKR ${Number(order.total).toFixed(2)}</p>`);
          }
        }
        return;
      }

      // 2. Check if it's a Donation
      const donation = await tx.donation.findUnique({ where: { id: event.orderId } });
      if (donation) {
        if (donation.status === 'INITIATED') {
          await tx.donation.update({
            where: { id: donation.id },
            data: { status: 'SUCCEEDED', stripePaymentId: event.txnRef }
          });

          const updatedRequest = await tx.donationRequest.update({
            where: { id: donation.donationRequestId },
            data: {
              raisedAmount: { increment: donation.amount },
              donorCount: { increment: 1 }
            },
            include: {
              center: { include: { user: true } },
              donations: { where: { status: 'SUCCEEDED' }, include: { customer: true } }
            }
          });

          // Check if target reached
          if (Number(updatedRequest.raisedAmount) >= Number(updatedRequest.targetAmount) && updatedRequest.status === 'OPEN') {
            await tx.donationRequest.update({ where: { id: updatedRequest.id }, data: { status: 'FULFILLED' } });

            if (updatedRequest.listingId) {
              const listing = await tx.listing.findUnique({ where: { id: updatedRequest.listingId } });
              if (listing && listing.qtyAvailable > 0) {
                const price = Number(listing.discountPrice);
                const qty = Math.max(1, Math.min(listing.qtyAvailable, Math.floor(Number(updatedRequest.raisedAmount) / price)));
                
                const o = await tx.order.create({
                  data: {
                    buyerId: updatedRequest.centerId,
                    providerId: listing.providerId,
                    type: 'DONATION',
                    fulfillmentMode: 'PICKUP',
                    paymentMethod: 'ONLINE',
                    status: 'PAID',
                    donationCenterId: updatedRequest.centerId,
                    donationRequestId: updatedRequest.id,
                    subtotal: price * qty,
                    total: price * qty,
                  }
                });
                await tx.orderItem.create({ data: { orderId: o.id, listingId: listing.id, qty, unitPrice: price, totalPrice: price * qty } });
                await tx.listing.update({ where: { id: listing.id }, data: { qtyAvailable: { decrement: qty } } });
              }
            }
          }
        }
        return;
      }

      throw new Error('Transaction ID not found in orders or donations');
    });
  } else {
    const orderId = (event as any).orderId;
    if (orderId) {
      await prisma.payment.updateMany({ where: { orderId }, data: { status: 'FAILED' } });
      await prisma.order.updateMany({ where: { id: orderId, status: 'AWAITING_PAYMENT' }, data: { status: 'CANCELED' } });
    }
  }
}
