import express from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getPaymentProvider } from '../services/payments/index.js';
import { ah } from '../utils/asyncHandler.js';

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

async function handlePaymentEvent(event: any) {
  if (event.type === 'payment.succeeded') {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: event.orderId }, include: { items: true } });
      if (!order) throw new Error('Order not found');

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
      } else {
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: { orderId: order.id, provider: process.env.PAYMENT_PROVIDER || 'payhere', method: 'card', amount: order.total, status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any },
          update: { status: 'SUCCEEDED', txnRef: event.txnRef, gatewayPayload: event.raw as any }
        });
      }
    });
  } else {
    const orderId = (event as any).orderId;
    if (orderId) {
      await prisma.payment.updateMany({ where: { orderId }, data: { status: 'FAILED' } });
      await prisma.order.updateMany({ where: { id: orderId, status: 'AWAITING_PAYMENT' }, data: { status: 'CANCELED' } });
    }
  }
}
