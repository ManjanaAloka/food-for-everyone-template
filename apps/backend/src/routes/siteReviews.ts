import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.post('/', requireAuth, ah(async (req: any, res) => {
  const { rating, comment } = z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional()
  }).parse(req.body);

  const review = await prisma.siteReview.create({
    data: {
      userId: req.user!.sub,
      rating,
      comment,
      status: 'PENDING'
    }

  });

  res.json({ review });
}));

router.get('/', ah(async (_req, res) => {
  const reviews = await prisma.siteReview.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          role: true
        }
      }
    }
  });

  res.json({ reviews });
}));

router.get('/all', requireAuth, requireRole('ADMIN', 'SYSTEM_ADMIN'), ah(async (_req, res) => {
  const reviews = await prisma.siteReview.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ reviews });
}));

router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'SYSTEM_ADMIN'), ah(async (req, res) => {
  const { id } = req.params;
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).parse(req.body);
  const updated = await prisma.siteReview.update({ where: { id }, data: { status } });
  res.json({ review: updated });
}));

router.delete('/:id', requireAuth, requireRole('ADMIN', 'SYSTEM_ADMIN'), ah(async (req, res) => {
  const { id } = req.params;
  await prisma.siteReview.delete({ where: { id } });
  res.json({ ok: true });
}));

