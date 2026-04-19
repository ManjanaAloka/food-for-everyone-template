import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/pending/providers', ah(async (_req, res) => {
  const providers = await prisma.serviceProvider.findMany({ where: { verifiedAt: null }, include: { user: true } });
  res.json({ providers });
}));
router.post('/providers/:userId/approve', ah(async (req, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await tx.serviceProvider.update({ where: { userId }, data: { verifiedAt: new Date() } });
  });
  res.json({ ok: true });
}));

router.get('/pending/centers', ah(async (_req, res) => {
  const centers = await prisma.donationCenter.findMany({ where: { verifiedAt: null }, include: { user: true } });
  res.json({ centers });
}));
router.post('/centers/:userId/approve', ah(async (req, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await tx.donationCenter.update({ where: { userId }, data: { verifiedAt: new Date() } });
  });
  res.json({ ok: true });
}));

router.get('/reviews', ah(async (req, res) => {
  const status = (req.query.status as string) || 'PENDING';
  const reviews = await prisma.review.findMany({ where: { status: status as any }, orderBy: { createdAt: 'desc' } });
  res.json({ reviews });
}));
router.post('/reviews/:id/approve', ah(async (req, res) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
  res.json({ ok: true });
}));
router.post('/reviews/:id/reject', ah(async (req, res) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
  res.json({ ok: true });
}));

router.get('/users', ah(async (_req, res) => {
  const users = await prisma.user.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
  res.json({ users });
}));

router.get('/orders', ah(async (_req, res) => {
  const orders = await prisma.order.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { buyer: true, provider: { include: { user: true } } } });
  res.json({ orders });
}));

router.get('/listings', ah(async (_req, res) => {
  // Fetch listings without relations first
  const listings = await prisma.listing.findMany({ 
    take: 100
  });
  
  // Fetch providers separately
  const providerIds = [...new Set(listings.map(l => l.providerId))];
  const providers = await prisma.serviceProvider.findMany({
    where: { userId: { in: providerIds } },
    include: { user: { select: { name: true, email: true } } }
  });
  
  // Map providers to listings
  const providersMap = new Map(providers.map(p => [p.userId, p]));
  const listingsWithProvider = listings.map(listing => ({
    ...listing,
    provider: providersMap.get(listing.providerId) || null
  }));
  
  res.json({ listings: listingsWithProvider });
}));

router.patch('/listings/:id', ah(async (req, res) => {
  const { id } = req.params;
  const { status } = z.object({ status: z.enum(['ACTIVE', 'HIDDEN', 'EXPIRED']) }).parse(req.body);
  const listing = await prisma.listing.update({ where: { id }, data: { status } });
  res.json({ listing });
}));

router.delete('/listings/:id', ah(async (req, res) => {
  const { id } = req.params;
  await prisma.listing.delete({ where: { id } });
  res.json({ ok: true });
}));
