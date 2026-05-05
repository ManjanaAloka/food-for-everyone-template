import express, { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { notifyEmail } from '../services/notifications.js';
import { getPaymentProvider } from '../services/payments/index.js';

export const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

// ─── GET all open donation requests (public) ────────────────────────────────
router.get('/', ah(async (req, res) => {
  const { listingId } = req.query;
  const where: any = { status: 'OPEN' };
  if (listingId) where.listingId = String(listingId);

  const requests = await prisma.donationRequest.findMany({
    where,
    include: {
      center: { select: { name: true, address: true } },
      listing: { select: { id: true, title: true, category: true, images: true, discountPrice: true, expiresAt: true, qtyAvailable: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
}));


// ─── GET my donation history (Customer) ──────────────────────────────────────
router.get('/my/history', requireAuth, ah(async (req: any, res) => {
  const donations = await prisma.donation.findMany({
    where: { customerId: req.user!.sub, status: 'SUCCEEDED' },
    include: { donationRequest: { select: { title: true, status: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ donations });
}));

// ─── GET my donation requests (Donation Center) ───────────────────────────────
router.get('/center/my-requests', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const requests = await prisma.donationRequest.findMany({
    where: { centerId: req.user!.sub },
    include: {
      listing: { select: { title: true, images: true, discountPrice: true } },
      donations: { where: { status: 'SUCCEEDED' }, select: { amount: true, createdAt: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
}));

// ─── GET single donation request ─────────────────────────────────────────────
router.get('/:id', ah(async (req, res) => {
  const request = await prisma.donationRequest.findUnique({
    where: { id: req.params.id },
    include: {
      center: { select: { name: true, address: true } },
      listing: { select: { id: true, title: true, category: true, images: true, discountPrice: true, expiresAt: true, qtyAvailable: true } },
      donations: {
        where: { status: 'SUCCEEDED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { amount: true, createdAt: true, customer: { select: { name: true } } }
      }
    }
  });
  if (!request) return res.status(404).json({ error: 'Not found' });
  res.json({ request });
}));

// ─── CREATE donation request (Donation Center only) ──────────────────────────
router.post('/', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const body = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    listingId: z.string().optional(),
    targetAmount: z.coerce.number().positive(),
    targetQty: z.coerce.number().int().positive().optional(),
    closesAt: z.string().optional()
  }).parse(req.body);

  const request = await prisma.donationRequest.create({
    data: {
      centerId: req.user!.sub,
      title: body.title,
      description: body.description,
      listingId: body.listingId || null,
      targetAmount: body.targetAmount,
      targetQty: body.targetQty || 0,
      closesAt: body.closesAt ? new Date(body.closesAt) : null
    }
  });
  res.json({ request });
}));

// ─── UPDATE donation request (Donation Center / Admin) ───────────────────────
router.patch('/:id', requireAuth, requireRole('DONATION_CENTER', 'ADMIN'), ah(async (req: any, res) => {
  const { id } = req.params;
  const data = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['OPEN', 'FULFILLED', 'CLOSED']).optional()
  }).parse(req.body);

  const existing = await prisma.donationRequest.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role !== 'ADMIN' && existing.centerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.donationRequest.update({ where: { id }, data });
  res.json({ request: updated });
}));

// ─── INITIATE donation via Configured Payment Provider (Customer) ───────────
router.post('/:id/checkout', requireAuth, ah(async (req: any, res) => {
  console.log('--- DONATION CHECKOUT START ---');
  try {
    const { amount } = z.object({ amount: z.coerce.number().positive().min(10) }).parse(req.body);
    console.log('Amount:', amount);

    const request = await prisma.donationRequest.findUnique({
      where: { id: req.params.id },
      include: { listing: true }
    });
    console.log('Request found:', !!request);
    
    if (!request) return res.status(404).json({ error: 'Donation request not found' });
    if (request.status !== 'OPEN') return res.status(400).json({ error: 'Donation request is no longer open' });

    // Check if amount exceeds remaining needed
    const remainingNeeded = Number(request.targetAmount) - Number(request.raisedAmount);
    if (amount > remainingNeeded + 0.01) { // 0.01 buffer for float issues
      return res.status(400).json({ error: `You can only donate up to LKR ${remainingNeeded.toFixed(2)} for this request.` });
    }

    console.log('Finding buyer:', req.user!.sub);
    const buyer = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    console.log('Buyer found:', !!buyer);

    // Create pending Donation record
    console.log('Creating donation record...');
    const donation = await prisma.donation.create({
      data: {
        customerId: req.user!.sub,
        donationRequestId: request.id,
        amount,
        status: 'INITIATED'
      }
    });
    console.log('Donation created:', donation.id);

    const provider = getPaymentProvider();
    console.log('Provider:', provider.name);
    
    // Prepare a pseudo-order for the provider
    const pseudoOrder = {
      id: donation.id,
      total: amount,
      items: [{ title: `Donation: ${request.title}` }],
      buyer: {
        name: buyer?.name || 'Customer',
        email: buyer?.email || 'noreply@example.com'
      }
    };

    console.log('Creating checkout session...');
    const session = await provider.createCheckoutSession(pseudoOrder);
    console.log('Session created:', !!session);
    
    // Update donation with session ID if applicable (e.g. for Stripe)
    if (session.url && !session.fields) {
      await prisma.donation.update({ where: { id: donation.id }, data: { stripeSessionId: session.url } });
    }

    res.json(session);
  } catch (err: any) {
    console.error('--- DONATION CHECKOUT ERROR ---');
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}));

// ─── Stripe webhook for donation payments ─────────────────────────────────────
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), ah(async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_DONATION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return res.status(400).json({ error: 'Missing signature' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId || session.client_reference_id;
    if (!donationId) return res.json({ received: true });

    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.update({
        where: { id: donationId },
        data: { status: 'SUCCEEDED', stripePaymentId: session.payment_intent as string }
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

        // Auto-create an order for the Donation Center if a listing was linked
        if (updatedRequest.listingId) {
          const listing = await tx.listing.findUnique({ where: { id: updatedRequest.listingId } });
          if (listing && listing.qtyAvailable > 0) {
            const price = Number(listing.discountPrice);
            // Calculate how many items the raised amount can buy
            const qty = Math.max(1, Math.min(listing.qtyAvailable, Math.floor(Number(updatedRequest.raisedAmount) / price)));
            
            const o = await tx.order.create({
              data: {
                buyerId: updatedRequest.centerId,
                providerId: listing.providerId,
                type: 'DONATION',
                fulfillmentMode: 'PICKUP',
                paymentMethod: 'ONLINE',
                status: 'PAID', // Already funded by donors
                donationCenterId: updatedRequest.centerId,
                donationRequestId: updatedRequest.id,
                subtotal: price * qty,
                total: price * qty,
              }
            });
            await tx.orderItem.create({
              data: { 
                orderId: o.id, 
                listingId: listing.id, 
                providerId: listing.providerId,
                qty, 
                unitPrice: price, 
                snapshotExpiresAt: listing.expiresAt
              }
            });
            await tx.listing.update({
              where: { id: listing.id },
              data: { qtyAvailable: { decrement: qty } }
            });
          }
        }

        // Notify donation center
        await notifyEmail(
          updatedRequest.center.user.email,
          `🎉 Donation Request Fully Funded: ${updatedRequest.title}`,
          `<p>Your donation request "<strong>${updatedRequest.title}</strong>" has been fully funded! Total raised: LKR ${updatedRequest.raisedAmount}.</p>`
        );

        // Notify all donors
        for (const d of updatedRequest.donations) {
          await notifyEmail(
            d.customer.email,
            '❤️ Your donation made it happen!',
            `<p>Great news! The donation request "<strong>${updatedRequest.title}</strong>" has been fully funded thanks to you and other generous donors!</p>`
          );
        }

        // Emit socket event
        const io = (global as any).__io;
        if (io) io.emit('donation:fulfilled', { requestId: updatedRequest.id });
      } else {
        // Real-time progress update
        const io = (global as any).__io;
        if (io) io.emit('donation:progress', {
          requestId: donation.donationRequestId,
          raisedAmount: Number(updatedRequest.raisedAmount),
          donorCount: updatedRequest.donorCount
        });
      }
    });
  }

  res.json({ received: true });
}));


