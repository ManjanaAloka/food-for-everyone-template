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
  const isBuyer = order.buyerId === req.user!.sub;
  const isRecipient = order.type === 'DONATION' && order.donationCenterId === req.user!.sub;

  if (!isBuyer && !isRecipient) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const validStatuses = ['AWAITING_PAYMENT', 'RESERVED', 'PAID', 'PENDING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  if (!validStatuses.includes(order.status)) {
    return res.status(400).json({ error: 'Order status does not allow reviews yet.' });
  }


  const review = await prisma.review.create({ data: { orderId: order.id, reviewerId: req.user!.sub, providerId: order.providerId, rating: body.rating, comment: body.comment } });
  res.json({ review });
}));

router.patch('/:id', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const body = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().optional() }).parse(req.body);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.reviewerId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });
  const updated = await prisma.review.update({ where: { id }, data: { rating: body.rating, comment: body.comment } });
  res.json({ review: updated });
}));


router.get('/provider/:providerId', ah(async (req, res) => {
  const { providerId } = req.params;
  const reviews = await prisma.review.findMany({ where: { providerId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
  res.json({ reviews });
}));

router.get('/my-reviews', requireAuth, ah(async (req: any, res) => {
  const reviews = await prisma.review.findMany({ 
    where: { providerId: req.user!.sub },
    include: { 
      reviewer: { select: { name: true } }, 
      order: { 
        select: { 
          id: true, 
          items: { include: { listing: { select: { title: true } } } } 
        } 
      } 
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ reviews });
}));

router.patch('/:id/status', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).parse(req.body);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  
  if (review.providerId !== req.user!.sub && !['ADMIN', 'SYSTEM_ADMIN'].includes(req.user!.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.review.update({ where: { id }, data: { status } });
  res.json({ review: updated });
}));

router.post('/:id/respond', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const { response } = z.object({ response: z.string().min(2) }).parse(req.body);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ error: 'Not found' });
  if (review.providerId !== req.user!.sub && !['ADMIN', 'SYSTEM_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Forbidden' });
  const updated = await prisma.review.update({ where: { id }, data: { providerResponse: response } });
  res.json({ review: updated });
}));
