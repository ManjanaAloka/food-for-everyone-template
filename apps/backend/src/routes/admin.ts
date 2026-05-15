import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { ah } from '../utils/asyncHandler.js';
import { notifyEmail } from '../services/notifications.js';
import argon2 from 'argon2';

export const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'SYSTEM_ADMIN', 'MANAGER'));

// ─── helper to write audit log ───────────────────────────────────────────────
async function audit(actorId: string, action: string, entity: string, entityId: string, before?: any, after?: any) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, before, after } });
}

// ─── PENDING APPROVALS ───────────────────────────────────────────────────────
router.get('/pending/providers', ah(async (_req, res) => {
  const providers = await prisma.serviceProvider.findMany({ where: { verifiedAt: null }, include: { user: true } });
  res.json({ providers });
}));

router.post('/providers/:userId/approve', ah(async (req: any, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await tx.serviceProvider.update({ where: { userId }, data: { verifiedAt: new Date() } });
  });
  await audit(req.user!.sub, 'APPROVE_PROVIDER', 'ServiceProvider', userId, before, { status: 'ACTIVE' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyEmail(user?.email, '✅ FreshSave — Registration Approved', `<p>Congratulations! Your service provider account has been approved. You can now log in and start listing items.</p>`);
  res.json({ ok: true });
}));

router.post('/providers/:userId/reject', ah(async (req: any, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await audit(req.user!.sub, 'REJECT_PROVIDER', 'ServiceProvider', userId, before, { status: 'SUSPENDED', reason });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyEmail(user?.email, '❌ FreshSave — Registration Not Approved', `<p>Unfortunately, your service provider registration was not approved.</p><p><strong>Reason:</strong> ${reason}</p><p>Please contact support if you have questions.</p>`);
  res.json({ ok: true });
}));

router.get('/pending/centers', ah(async (_req, res) => {
  const centers = await prisma.donationCenter.findMany({ where: { verifiedAt: null }, include: { user: true } });
  res.json({ centers });
}));

router.post('/centers/:userId/approve', ah(async (req: any, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await tx.donationCenter.update({ where: { userId }, data: { verifiedAt: new Date() } });
  });
  await audit(req.user!.sub, 'APPROVE_CENTER', 'DonationCenter', userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyEmail(user?.email, '✅ FreshSave — Donation Center Approved', `<p>Your donation center account has been approved! You can now post donation requests.</p>`);
  res.json({ ok: true });
}));

router.post('/centers/:userId/reject', ah(async (req: any, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);
  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await audit(req.user!.sub, 'REJECT_CENTER', 'DonationCenter', userId, null, { reason });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyEmail(user?.email, '❌ FreshSave — Center Registration Rejected', `<p>Reason: ${reason}</p>`);
  res.json({ ok: true });
}));

// ─── REVIEW MODERATION ───────────────────────────────────────────────────────
router.get('/reviews', ah(async (req, res) => {
  const status = (req.query.status as string) || 'PENDING';
  const type = (req.query.type as string) || 'PROVIDER';

  if (type === 'SITE') {
    const reviews = await prisma.siteReview.findMany({
      where: { status: status as any },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    // Map 'user' to 'reviewer' for consistency in frontend
    return res.json({ reviews: reviews.map((r: any) => ({ ...r, reviewer: r.user })) });
  }

  const reviews = await prisma.review.findMany({
    where: { status: status as any },
    include: { reviewer: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ reviews });
}));

router.post('/site-reviews/:id/approve', ah(async (req: any, res) => {
  await prisma.siteReview.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
  await audit(req.user!.sub, 'APPROVE_SITE_REVIEW', 'SiteReview', req.params.id);
  res.json({ ok: true });
}));

router.post('/site-reviews/:id/reject', ah(async (req: any, res) => {
  await prisma.siteReview.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
  await audit(req.user!.sub, 'REJECT_SITE_REVIEW', 'SiteReview', req.params.id);
  res.json({ ok: true });
}));


router.post('/reviews/:id/approve', ah(async (req: any, res) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
  await audit(req.user!.sub, 'APPROVE_REVIEW', 'Review', req.params.id);
  // Update provider avg rating
  const stats = await prisma.review.aggregate({ where: { providerId: review.providerId, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
  await prisma.serviceProvider.update({ where: { userId: review.providerId }, data: { ratingAvg: stats._avg.rating || 0, ratingCount: stats._count } });
  res.json({ ok: true });
}));

router.post('/reviews/:id/reject', ah(async (req: any, res) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
  await audit(req.user!.sub, 'REJECT_REVIEW', 'Review', req.params.id);
  res.json({ ok: true });
}));

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/users', ah(async (req, res) => {
  const { role, status, q } = req.query;
  const where: any = {};
  if (role) where.role = String(role);
  if (status) where.status = String(status);
  if (q) where.OR = [{ name: { contains: String(q) } }, { email: { contains: String(q) } }];
  const users = await prisma.user.findMany({
    where,
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      providerProfile: { select: { businessName: true, ratingAvg: true, ratingCount: true, verifiedAt: true } },
      donationCenterProfile: { select: { name: true, verifiedAt: true } }
    }
  });
  res.json({ users });
}));

router.post('/users', ah(async (req: any, res) => {
  if (req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Only System Admins can create administrative users' });
  }

  const data = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']),
    permissions: z.any().optional()
  }).parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) return res.status(400).json({ error: 'Email already in use' });

  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role as any,
      status: 'ACTIVE',
      permissions: data.permissions,
      forcePasswordChange: true
    }
  });

  await audit(req.user!.sub, 'CREATE_ADMIN', 'User', user.id, null, { email: user.email, role: user.role, permissions: data.permissions });
  res.json({ user });
}));

router.delete('/users/:id', ah(async (req: any, res) => {
  if (req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Only System Admins can delete users' });
  }
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Prevent deleting self
  if (user.id === req.user.sub) return res.status(400).json({ error: 'You cannot delete yourself' });

  await prisma.user.delete({ where: { id } });
  await audit(req.user!.sub, 'DELETE_USER', 'User', id, user);
  res.json({ ok: true });
}));

router.post('/users/:id/ban', ah(async (req: any, res) => {
  const { id } = req.params;
  const { reason } = z.object({ reason: z.string().min(3) }).parse(req.body);
  const before = await prisma.user.findUnique({ where: { id }, select: { status: true } });
  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await audit(req.user!.sub, 'BAN_USER', 'User', id, before, { status: 'SUSPENDED', reason });
  const user = await prisma.user.findUnique({ where: { id } });
  await notifyEmail(user?.email, '⚠️ FreshSave — Account Suspended', `<p>Your account has been suspended. Reason: ${reason}</p><p>Contact support to appeal.</p>`);
  res.json({ ok: true });
}));

router.post('/users/:id/unban', ah(async (req: any, res) => {
  const { id } = req.params;
  const before = await prisma.user.findUnique({ where: { id }, select: { status: true } });
  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  await audit(req.user!.sub, 'UNBAN_USER', 'User', id, before, { status: 'ACTIVE' });
  res.json({ ok: true });
}));

// ─── LISTINGS MANAGEMENT ─────────────────────────────────────────────────────
router.get('/listings', ah(async (_req, res) => {
  const listings = await prisma.listing.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
  const providerIds = [...new Set(listings.map(l => l.providerId))];
  const providers = await prisma.serviceProvider.findMany({
    where: { userId: { in: providerIds } },
    include: { user: { select: { name: true, email: true } } }
  });
  const map = new Map(providers.map(p => [p.userId, p]));
  res.json({ listings: listings.map(l => ({ ...l, provider: map.get(l.providerId) || null })) });
}));

router.patch('/listings/:id', ah(async (req, res) => {
  const { id } = req.params;
  const { status } = z.object({ status: z.enum(['ACTIVE', 'HIDDEN', 'EXPIRED']) }).parse(req.body);
  const listing = await prisma.listing.update({ where: { id }, data: { status } });
  res.json({ listing });
}));

router.delete('/listings/:id', ah(async (req: any, res) => {
  const { id } = req.params;
  // Use soft-delete (HIDDEN) because hard-delete fails if there are associated orders/reviews
  await prisma.listing.update({ 
    where: { id }, 
    data: { status: 'HIDDEN' } 
  });
  await audit(req.user!.sub, 'SOFT_DELETE_LISTING', 'Listing', id);
  res.json({ ok: true });
}));

// ─── ORDERS ──────────────────────────────────────────────────────────────────
router.get('/orders', ah(async (_req, res) => {
  const orders = await prisma.order.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { buyer: { select: { name: true, email: true } }, provider: { include: { user: { select: { name: true } } } } }
  });
  res.json({ orders });
}));

// ─── PLATFORM STATS ──────────────────────────────────────────────────────────
router.get('/stats', ah(async (_req, res) => {
  const [
    activeListings,
    totalOrders,
    totalDonations,
    userCounts,
    foodSaved,
    donationsFulfilled
  ] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count({ where: { status: { not: 'CANCELED' } } }),
    prisma.donation.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true }, _count: true }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.orderItem.aggregate({ _sum: { qty: true } }),
    prisma.donationRequest.count({ where: { status: 'FULFILLED' } })
  ]);

  const usersByRole: Record<string, number> = {};
  for (const uc of userCounts) { usersByRole[uc.role] = uc._count; }

  res.json({
    activeListings,
    totalOrders,
    totalDonationAmount: Number(totalDonations._sum.amount || 0),
    totalDonorTransactions: totalDonations._count,
    usersByRole,
    foodItemsSaved: foodSaved._sum.qty || 0,
    donationsFulfilled
  });
}));

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
router.get('/audit-log', ah(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  });
  res.json({ logs });
}));

// ─── FLAGGED PROVIDERS (rating < 2.5 or 10+ one-star reviews) ───────────────
router.get('/flagged-providers', ah(async (_req, res) => {
  const flagged = await prisma.serviceProvider.findMany({
    where: { OR: [{ ratingAvg: { lt: 2.5, gt: 0 } }, { ratingCount: { gte: 10 } }] },
    include: { user: { select: { name: true, email: true, status: true } } }
  });
  // Also check one-star counts
  const withOneStar = await Promise.all(flagged.map(async (p) => {
    const oneStarCount = await prisma.review.count({ where: { providerId: p.userId, rating: 1, status: 'APPROVED' } });
    return { ...p, oneStarCount };
  }));
  const trulyFlagged = withOneStar.filter(p => p.ratingAvg < 2.5 || p.oneStarCount >= 10);
  res.json({ providers: trulyFlagged });
}));

// ─── DONATION REQUESTS management ────────────────────────────────────────────
router.get('/donations', ah(async (_req, res) => {
  const requests = await prisma.donationRequest.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { center: { select: { name: true } } }
  });
  res.json({ requests });
}));
