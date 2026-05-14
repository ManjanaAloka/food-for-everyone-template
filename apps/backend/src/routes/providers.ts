import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

// Public endpoint to list all verified providers
router.get('/', ah(async (_req, res) => {
  const providers = await prisma.serviceProvider.findMany({
    where: { verifiedAt: { not: null } },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { ratingAvg: 'desc' },
    take: 200
  });
  res.json({ providers });
}));

// Public detail endpoint
router.get('/:id', ah(async (req, res) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: req.params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  res.json({ provider });
}));

router.get('/me', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const me = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.sub } });
  res.json({ provider: me });
}));

router.patch('/me', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const data = z.object({
    businessName: z.string().min(1, 'Business name is required'),
    brNo: z.string().min(1, 'BR Number is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional(),
    tin: z.string().optional(),

    deliveryOptions: z.any().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional()
  }).parse(req.body);

  const updated = await prisma.serviceProvider.update({ where: { userId: req.user!.sub }, data });
  res.json({ provider: updated });
}));

router.get('/me/listings', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const status = req.query.status as string | undefined;
  const where: any = { providerId: req.user!.sub };
  console.log('🔍 Fetching listings for providerId:', req.user!.sub);
  if (status) where.status = status;
  const listings = await prisma.listing.findMany({ where, orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }], take: 200 });
  console.log('✅ Found listings:', listings.length);
  res.json({ listings });
}));

router.get('/me/orders', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const limit = Number(req.query.limit || 20);
  const orders = await prisma.order.findMany({
    where: { providerId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
    select: { id: true, status: true, type: true, fulfillmentMode: true, total: true, createdAt: true, updatedAt: true }
  });
  res.json({ orders });
}));

router.get('/me/listings/:id/orders', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const { id } = req.params;
  const orders = await prisma.order.findMany({
    where: { 
      providerId: req.user!.sub,
      items: {
        some: { listingId: id }
      }
    },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      items: { include: { listing: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
}));

router.get('/me/stats', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const providerId = req.user!.sub;
  const { from, to } = req.query;

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  const whereBase: any = { providerId };
  if (Object.keys(dateFilter).length > 0) {
    whereBase.createdAt = dateFilter;
  }

  const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
    prisma.order.count({ where: { ...whereBase, status: { not: 'CANCELED' } } }),
    prisma.order.count({ where: { ...whereBase, status: { in: ['CREATED', 'RESERVED', 'AWAITING_PAYMENT', 'PAID', 'PENDING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'] } } }),
    prisma.order.count({ where: { ...whereBase, status: 'DELIVERED' } })
  ]);

  const orders = await prisma.order.findMany({
    where: { ...whereBase, status: { notIn: ['CANCELED', 'EXPIRED', 'REFUNDED'] } },
    select: { total: true, status: true, paymentMethod: true }
  });

  let totalEarnings = 0;
  let pendingEarnings = 0;
  let codEarnings = 0;

  for (const o of orders) {
    const val = Number(o.total);
    if (o.status === 'DELIVERED') {
      totalEarnings += val;
      if (o.paymentMethod === 'COD') codEarnings += val;
    } else {
      pendingEarnings += val;
    }
  }

  res.json({
    stats: {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalEarnings,
      pendingEarnings,
      codEarnings
    }
  });
}));
