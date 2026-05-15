import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notifyEmail, createNotification } from '../services/notifications.js';
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
  city: z.string().optional(),
  deliveryFee: z.coerce.number().optional()
});

router.get('/center', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const orders = await prisma.order.findMany({
    where: { 
      donationCenterId: req.user!.sub,
      status: { notIn: ['CANCELED'] }
    },
    include: {
      items: {
        include: {
          listing: true
        }
      },
      buyer: {
        select: { name: true, email: true, phone: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
}));

router.get('/me', requireAuth, ah(async (req: any, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const orders = await prisma.order.findMany({
    where: { 
      buyerId: req.user!.sub
    },
    include: {
      items: {
        include: {
          listing: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  res.json({ orders });
}));

router.get('/:id', requireAuth, ah(async (req: any, res) => {
  const order = await prisma.order.findUnique({ 
    where: { id: req.params.id }, 
    include: { 
      items: {
        include: {
          listing: true
        }
      }, 
      payment: true,
      review: true,
      buyer: {
        select: {
          name: true,
          email: true,
          phone: true,
          customerProfile: true
        }
      },
      donationCenter: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      }

    } 
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.buyerId !== req.user!.sub && req.user!.role !== 'ADMIN' && order.providerId !== req.user!.sub && order.donationCenterId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  res.json({ order });
}));

router.get('/', requireAuth, ah(async (req: any, res) => {
  const orders = await prisma.order.findMany({
    where: { 
      OR: [
        { buyerId: req.user!.sub },
        { providerId: req.user!.sub }
      ]
    },
    include: {
      items: {
        include: {
          listing: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
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
  const deliveryFee = body.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  const order = await prisma.$transaction(async (tx) => {
    const totalSoldAggregate = await tx.orderItem.aggregate({
      where: {
        providerId,
        order: { status: { in: ['PAID', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'] } }
      },
      _sum: { qty: true }
    });
    const totalQtySold = totalSoldAggregate._sum.qty || 0;
    const isOverLimit = totalQtySold >= 50;
    const commissionAmount = isOverLimit ? (total * 0.02) : 0;

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
        deliveryFee: deliveryFee.toFixed(2),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        isCommissionApplied: isOverLimit
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
  const { status } = z.object({ status: z.enum(['PENDING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED']) }).parse(req.body);



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

// Customer cancels own order within 30 mins
router.post('/:id/cancel', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ 
    where: { id }, 
    include: { items: true } 
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  // Check 30 min window
  const now = new Date();
  const diffMs = now.getTime() - order.createdAt.getTime();
  const diffMins = diffMs / (1000 * 60);
  if (diffMins > 30) {
    return res.status(400).json({ error: 'Cancellation window (30 mins) has expired' });
  }

  // Check status
  if (!['AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PENDING'].includes(order.status)) {
    return res.status(400).json({ error: `Cannot cancel order in ${order.status} status` });
  }


  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: 'CANCELED' } });
    for (const item of order.items) {
      await tx.listing.update({ 
        where: { id: item.listingId }, 
        data: { qtyAvailable: { increment: item.qty }, status: 'ACTIVE' } 
      });
    }
  });

  await notifyStatusChange(order, 'CANCELED');
  res.json({ ok: true, status: 'CANCELED' });
}));


function canTransition(current: string, next: string, mode: string) {
  const fromTo: Record<string, string[]> = {
    AWAITING_PAYMENT: ['CANCELED'],
    PAID: mode === 'PICKUP' ? ['PENDING', 'READY_FOR_PICKUP', 'CANCELED'] : ['PENDING', 'READY_FOR_DELIVERY', 'CANCELED'],
    RESERVED: mode === 'PICKUP' ? ['PENDING', 'READY_FOR_PICKUP', 'CANCELED'] : ['PENDING', 'READY_FOR_DELIVERY', 'CANCELED'],
    PENDING: mode === 'PICKUP' ? ['READY_FOR_PICKUP', 'CANCELED'] : ['READY_FOR_DELIVERY', 'CANCELED'],
    READY_FOR_PICKUP: ['DELIVERED', 'CANCELED'],
    READY_FOR_DELIVERY: ['OUT_FOR_DELIVERY', 'CANCELED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELED']

  };

  if (current === next) return true;
  if (!fromTo[current]) return false;
  return fromTo[current].includes(next);

}
async function notifyStatusChange(order: any, status: string, byCenter = false) {
  try {
    const displayId = order.orderNumber ? `O-${order.orderNumber.toString().padStart(4, '0')}` : order.id;
    const subject = `Order ${displayId} status: ${status}`;
    const message = `Order <strong>${displayId}</strong> is now <strong>${status}</strong>.`;
    const msg = `<p>Status update for your order <strong>${displayId}</strong>: <strong>${status}</strong>.</p>`;
    
    // 1. Create DB Notifications & Emit Sockets (PRIORITY)
    const io = (global as any).__io;
    console.log(`[Socket] Attempting to notify participants of order:${order.id} status:${status}`);

    if (io) {
      // To Buyer
      if (order.buyerId) {
        await createNotification(order.buyerId, 'ORDER_UPDATE', 'IN_APP', { message, orderId: order.id, status });
        io.to(`user:${order.buyerId}`).emit('notification', { type: 'ORDER_UPDATE', message, orderId: order.id, status });
        console.log(`[Socket] Notified Buyer: user:${order.buyerId}`);
      }

      // To Provider
      if (order.providerId) {
        // Also notify the provider so they see the real-time feedback
        io.to(`user:${order.providerId}`).emit('notification', { type: 'ORDER_UPDATE', message, orderId: order.id, status });
        console.log(`[Socket] Notified Provider: user:${order.providerId}`);
      }

      // To Donation Center
      if (order.type === 'DONATION' && order.donationCenterId) {
        await createNotification(order.donationCenterId, 'ORDER_UPDATE', 'IN_APP', { message, orderId: order.id, status });
        io.to(`user:${order.donationCenterId}`).emit('notification', { type: 'ORDER_UPDATE', message, orderId: order.id, status });
        console.log(`[Socket] Notified Center: user:${order.donationCenterId}`);
      }
    } else {
      console.warn('[Socket] Global IO not found! Real-time notifications skipped.');
      if (order.buyerId) await createNotification(order.buyerId, 'ORDER_UPDATE', 'IN_APP', { message, orderId: order.id, status });
      if (order.type === 'DONATION' && order.donationCenterId) await createNotification(order.donationCenterId, 'ORDER_UPDATE', 'IN_APP', { message, orderId: order.id, status });
    }

    // 2. Send Emails (Secondary)
    try {
      if (order.buyer?.email) {
        await notifyEmail(order.buyer.email, subject, msg);
      }
    
      if (order.type === 'DONATION') {
        if (order.donationCenter?.user?.email) {
          await notifyEmail(order.donationCenter.user.email, subject, msg);
        }
        if (order.provider?.user?.email) {
          await notifyEmail(order.provider.user.email, subject, msg);
        }
      }
    } catch (emailErr) {
      console.error('Email notification failed (swallowed):', emailErr);
    }

  } catch (err) {
    console.error('Failed to send status update notifications:', err);
  }
}

