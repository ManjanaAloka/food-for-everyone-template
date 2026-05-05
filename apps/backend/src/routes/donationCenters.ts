import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.get('/', ah(async (_req, res) => {
  const centers = await prisma.donationCenter.findMany({
    where: { verifiedAt: { not: null } },
    select: { userId: true, name: true, address: true, lat: true, lng: true, image: true }
  });
  res.json({ centers });
}));

router.get('/requests', ah(async (_req, res) => {
  const requests = await prisma.donationRequest.findMany({
    where: { status: { in: ['OPEN', 'FULFILLED'] } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
}));

router.get('/:id', ah(async (req, res) => {
  const { id } = req.params;
  const center = await prisma.donationCenter.findUnique({
    where: { userId: id },
    include: {
      user: { select: { email: true, name: true } },
      requests: { where: { status: 'OPEN' }, include: { listing: true } },
      activities: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!center) return res.status(404).json({ error: 'Center not found' });
  res.json({ center });
}));

router.post('/requests', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const body = z.object({ title: z.string().min(3), description: z.string().optional(), targetQty: z.coerce.number().int().positive() }).parse(req.body);
  const request = await prisma.donationRequest.create({ data: { centerId: req.user!.sub, title: body.title, description: body.description, targetQty: body.targetQty } });
  res.json({ request });
}));

router.patch('/requests/:id', requireAuth, requireRole('DONATION_CENTER', 'ADMIN'), ah(async (req: any, res) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const data = z.object({ status: z.enum(['OPEN', 'FULFILLED', 'CLOSED']).optional(), title: z.string().optional(), description: z.string().optional() }).parse(req.body);
  const request = await prisma.donationRequest.update({ where: { id }, data });
  res.json({ request });
}));
