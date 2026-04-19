import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { scheduleExpiry } from '../queues/index.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.get('/', ah(async (req, res) => {
  const { q, category, providerId } = req.query;
  const where: any = { status: 'ACTIVE', expiresAt: { gt: new Date() } };
  if (q) where.OR = [{ title: { contains: String(q) }}, { description: { contains: String(q) }}];
  if (category) where.category = String(category);
  if (providerId) where.providerId = String(providerId);
  const listings = await prisma.listing.findMany({ where, orderBy: { expiresAt: 'asc' }, take: 100 });
  res.json({ listings });
}));

router.get('/:id', ah(async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json({ listing });
}));

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  ingredients: z.string().optional(),
  unitPrice: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive(),
  qtyAvailable: z.coerce.number().int().positive(),
  weightGrams: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().transform(s => new Date(s)),
  images: z.array(z.string()).optional()
});

const listingUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  ingredients: z.string().optional(),
  unitPrice: z.coerce.number().positive().optional(),
  discountPrice: z.coerce.number().positive().optional(),
  qtyAvailable: z.coerce.number().int().positive().optional(),
  weightGrams: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().transform(s => new Date(s)).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'HIDDEN', 'EXPIRED']).optional()
});

router.post('/', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const data = listingSchema.parse(req.body);
  const listing = await prisma.listing.create({ data: { ...data, providerId: req.user!.sub } });
  await scheduleExpiry(listing.id, listing.expiresAt);
  req.app.get('io').emit('listing:new', { id: listing.id, title: listing.title });
  res.json({ listing });
}));

router.patch('/:id', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const id = req.params.id;
  const data = listingUpdateSchema.parse(req.body);
  const listing = await prisma.listing.update({ where: { id, providerId: req.user!.sub }, data });
  res.json({ listing });
}));

router.delete('/:id', requireAuth, requireRole('PROVIDER'), ah(async (req: any, res) => {
  const id = req.params.id;
  await prisma.listing.update({ where: { id, providerId: req.user!.sub }, data: { status: 'HIDDEN' } });
  res.json({ ok: true });
}));
