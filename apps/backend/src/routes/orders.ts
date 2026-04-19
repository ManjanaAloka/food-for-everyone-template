import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notifyEmail } from '../services/notifications.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

const createOrderSchema = z.object({
  items: z.array(z.object({ listingId: z.string(), qty: z.coerce.number().int().positive() })).min(1),
  type: z.enum(['PERSONAL', 'DONATION']),
  fulfillmentMode: z.enum(['PICKUP', 'DELIVERY']),
  paymentMethod: z.enum(['ONLINE', 'COD']),
  donationCenterId: z.string().optional(),
  donationRequestId: z.string().optional(),
  scheduledTime: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional()
});

router.get('/:id', requireAuth, ah(async (req: any, res) => {
  const order = await prisma.order.findUnique({ 
    where: { id: req.params.id }, 
    include: { 
      items: true, 
      payment: true,
      review: true
    } 
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.buyerId !== req.user!.sub && req.user!.role !== 'ADMIN' && order.providerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });
  res.json({ order });
}));

router.post('/', requireAuth, ah(async (req: any, res) => {
  const body = createOrderSchema.parse(req.body);
  if (body.type === 'DONATION' && body.paymentMethod === 'COD') return res.status(400).json({ error: 'Donations require online payment' });

  const listingIds = body.items.map(i => i.listingId);
  const listings = await prisma.listing.findMany({ where: { id: { in: listingIds }, status: 'ACTIVE', expiresAt: { gt: new Date() } }});
  if (listings.length !== listingIds.length) return res.status(400).json({ error: 'Some listings unavailable' });

  const providerId = listings[0].providerId;
  if (!listings.every(l => l.providerId === providerId)) return res.status(400).json({ error: 'All items must be from the same provider' });

  let subtotal = 0;
  for (const item of body.items) {
    const l = listings.find(x => x.id === item.listingId)!;
    if (item.qty > l.qtyAvailable) return res.status(400).json({ error: `Insufficient qty for ${l.title}` });
    subtotal += Number(l.discountPrice) * item.qty;
  }
  const total = subtotal;

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        buyerId: req.user!.sub,
        providerId,
        type: body.type,
        fulfillmentMode: body.fulfillmentMode,
        paymentMethod: body.paymentMethod,
        donationCenterId: body.type === 'DONATION' ? body.donationCenterId || null : null,
        donationRequestId: body.type === 'DONATION' ? body.donationRequestId || null : null,
        status: body.paymentMethod === 'ONLINE' ? 'AWAITING_PAYMENT' : 'RESERVED',
        scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : null,
        addressLine: body.addressLine,
        city: body.city,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2)
      }
    });
    for (const item of body.items) {
      const l = listings.find(x => x.id === item.listingId)!;
      await tx.orderItem.create({ data: { orderId: o.id, listingId: l.id, providerId: l.providerId, qty: item.qty, unitPrice: l.discountPrice, snapshotExpiresAt: l.expiresAt } });
    }
    if (body.paymentMethod === 'COD') {
      for (const item of body.items) {
        const updated = await tx.listing.updateMany({ where: { id: item.listingId, qtyAvailable: { gte: item.qty }, status: 'ACTIVE' }, data: { qtyAvailable: { decrement: item.qty } } });
        if (updated.count !== 1) throw new Error('Stock reservation failed');
      }
    }
    return o;
  });

  res.json({ orderId: order.id, total, status: order.status });
}));

// Provider/admin fulfillment updates
router.patch('/:id/status', requireAuth, requireRole('PROVIDER', 'ADMIN'), ah(async (req: any, res) => {
  const { id } = req.params;
  const { status } = z.object({ status: z.enum(['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED']) }).parse(req.body);

  const order = await prisma.order.findUnique({ where: { id }, include: { buyer: true, provider: { include: { user: true } }, donationCenter: { include: { user: true } } } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user!.role !== 'ADMIN' && order.providerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  const current = order.status;
  const mode = order.fulfillmentMode;
  if (!canTransition(current, status, mode)) return res.status(400).json({ error: `Invalid transition from ${current} to ${status}` });

  if (status === 'CANCELED') {
    if (['DELIVERED', 'REFUNDED', 'CANCELED'].includes(order.status)) return res.status(400).json({ error: 'Cannot cancel' });
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status } });
      for (const item of await tx.orderItem.findMany({ where: { orderId: order.id } })) {
        await tx.listing.update({ where: { id: item.listingId }, data: { qtyAvailable: { increment: item.qty }, status: 'ACTIVE' } });
      }
    });
    await notifyStatusChange(order, status);
    return res.json({ ok: true, status });
  }

  const updated = await prisma.order.update({ where: { id }, data: { status } });
  await notifyStatusChange(order, status);
  res.json({ ok: true, status: updated.status });
}));

// Donation center confirms receipt
router.post('/:id/confirm-received', requireAuth, requireRole('DONATION_CENTER', 'ADMIN'), ah(async (req: any, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { buyer: true, donationCenter: { include: { user: true } }, provider: { include: { user: true } } } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.type !== 'DONATION') return res.status(400).json({ error: 'Only for donation orders' });
  if (req.user!.role !== 'ADMIN' && order.donationCenterId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  if (order.status === 'DELIVERED') return res.json({ ok: true, status: 'DELIVERED' });
  const updated = await prisma.order.update({ where: { id }, data: { status: 'DELIVERED' } });
  await notifyStatusChange(order, 'DELIVERED', true);
  res.json({ ok: true, status: updated.status });
}));

function canTransition(current: string, next: string, mode: string) {
  const fromTo: Record<string, string[]> = {
    AWAITING_PAYMENT: ['CANCELED'],
    PAID: ['PREPARING', 'CANCELED'],
    RESERVED: ['PREPARING', 'CANCELED'],
    PREPARING: mode === 'PICKUP' ? ['READY_FOR_PICKUP', 'CANCELED'] : ['OUT_FOR_DELIVERY', 'CANCELED'],
    READY_FOR_PICKUP: ['DELIVERED', 'CANCELED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELED']
  };
  if (!fromTo[current]) return false;
  return fromTo[current].includes(next);
}
async function notifyStatusChange(order: any, status: string, byCenter = false) {
  const subject = `Order ${order.id} status: ${status}`;
  const msg = `<p>Status update for your order <strong>${order.id}</strong>: <strong>${status}</strong>.</p>`;
  await notifyEmail(order.buyer?.email, subject, msg);
  if (order.type === 'DONATION') {
    await notifyEmail(order.donationCenter?.user?.email, subject, msg);
    await notifyEmail(order.provider?.user?.email, subject, msg);
  }
}
