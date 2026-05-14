import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

router.get('/stats', ah(async (_req, res) => {
  const [
    userCounts,
    foodSaved,
    donationsFulfilled,
    revenue,
    ordersFulfilled,
    providerStats
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.orderItem.aggregate({ 
      where: { order: { status: { in: ['PAID', 'DELIVERED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'] } } },
      _sum: { qty: true } 
    }),
    prisma.donationRequest.count({ where: { status: 'FULFILLED' } }),
    prisma.order.aggregate({ 
      where: { status: { in: ['PAID', 'DELIVERED'] } }, 
      _sum: { total: true } 
    }),
    prisma.order.count({ where: { status: { in: ['PAID', 'DELIVERED'] } } }),
    prisma.serviceProvider.aggregate({ _avg: { ratingAvg: true } })
  ]);

  const usersByRole: Record<string, number> = {};
  for (const uc of userCounts) { usersByRole[uc.role] = uc._count; }

  res.json({
    activeMembers: (usersByRole['CUSTOMER'] || 0) + (usersByRole['PROVIDER'] || 0) + (usersByRole['DONATION_CENTER'] || 0),
    activeCustomers: (usersByRole['CUSTOMER'] || 0),
    partnerBusinesses: (usersByRole['PROVIDER'] || 0),
    communitiesSupported: (usersByRole['DONATION_CENTER'] || 0),
    mealsSaved: Number(foodSaved._sum.qty || 0),
    donationsFulfilled,
    revenueRecovered: Number(revenue._sum.total || 0),
    ordersFulfilled,
    avgRating: Number(providerStats._avg.ratingAvg || 0).toFixed(1)
  });


}));

router.get('/featured-reviews', ah(async (_req, res) => {
  const reviews = await prisma.review.findMany({
    where: { 
      status: 'APPROVED',
      rating: { gte: 4 },
      comment: { not: null, not: '' }
    },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: {
        select: {
          name: true,
          role: true
        }
      }
    }
  });

  res.json({ reviews });
}));

router.get('/latest-stories', ah(async (_req, res) => {
  const activities = await prisma.donationCenterActivity.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      center: {
        select: {
          name: true,
          image: true,
          userId: true
        }
      },
      request: {
        select: {
          title: true
        }
      }
    }
  });

  res.json({ activities });
}));

