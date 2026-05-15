import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { scheduleExpiry } from '../queues/index.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.get('/', ah(async (req, res) => {
  const { q, category, providerId, city, urgency, minPrice, maxPrice, sort, lat, lng, radius } = req.query;
  const now = new Date();

  const where: any = { status: 'ACTIVE', expiresAt: { gt: now }, qtyAvailable: { gt: 0 } };
  if (q) where.OR = [{ title: { contains: String(q) } }, { description: { contains: String(q) } }];
  if (category) where.category = String(category);
  if (providerId) where.providerId = String(providerId);
  if (city) where.provider = { city: { contains: String(city) } };
  if (minPrice) where.discountPrice = { ...where.discountPrice, gte: Number(minPrice) };
  if (maxPrice) where.discountPrice = { ...where.discountPrice, lte: Number(maxPrice) };

  // Urgency filter
  if (urgency === 'expiring-soon') {
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    where.expiresAt = { gt: now, lte: in24h };
  } else if (urgency === 'almost-gone') {
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    where.expiresAt = { gt: now, lte: in3d };
  }

  // Sort options
  let orderBy: any = { expiresAt: 'asc' }; // default: soonest first
  if (sort === 'newest') orderBy = { createdAt: 'desc' };
  else if (sort === 'price-asc') orderBy = { discountPrice: 'asc' };
  else if (sort === 'price-desc') orderBy = { discountPrice: 'desc' };

  let listings = await prisma.listing.findMany({
    where,
    orderBy,
    take: 100,
    include: { 
      provider: { select: { userId: true, businessName: true, city: true, ratingAvg: true, ratingCount: true, lat: true, lng: true } },
      donationRequests: { where: { status: 'OPEN' }, select: { id: true } }
    }
  });



  // Spatial filtering (Radius in KM)
  if (lat && lng && radius) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    const rad = Number(radius);

    listings = listings.filter((l: any) => {
      const pLat = Number(l.provider?.lat);
      const pLng = Number(l.provider?.lng);
      
      if (isNaN(pLat) || isNaN(pLng)) return false;
      
      const R = 6371; // Earth's radius in km
      const dLat = (pLat - userLat) * Math.PI / 180;
      const dLng = (pLng - userLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= rad;
    });

  }

  res.json({ listings });
}));


router.get('/:id', ah(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: {
      provider: {
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Fetch approved reviews for the provider
  const reviews = await prisma.review.findMany({
    where: { providerId: listing.providerId, status: 'APPROVED' },
    include: { reviewer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  res.json({ listing, reviews });
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
