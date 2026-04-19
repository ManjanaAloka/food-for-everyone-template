import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.post('/', requireAuth, ah(async (req: any, res) => {
  const body = z.object({ orderId: z.string(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().optional() }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });
  if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'Can only review delivered orders' });

  const review = await prisma.review.create({ data: { orderId: order.id, reviewerId: req.user!.sub, providerId: order.providerId, rating: body.rating, comment: body.comment } });
  res.json({ review });
}));

router.get('/provider/:providerId', ah(async (req, res) => {
  const { providerId } = req.params;
  const reviews = await prisma.review.findMany({ where: { providerId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
  res.json({ reviews });
}));

router.post('/:id/respond', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const { response } = z.object({ response: z.string().min(2) }).parse(req.body);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ error: 'Not found' });
  if (review.providerId !== req.user!.sub && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const updated = await prisma.review.update({ where: { id }, data: { providerResponse: response } });
  res.json({ review: updated });
}));
