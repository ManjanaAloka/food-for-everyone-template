import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
export const router = Router();

const CO2E_PER_KG = 2.5;

router.get('/public', ah(async (_req, res) => {
  const delivered = await prisma.order.findMany({ where: { status: 'DELIVERED' }, include: { items: { include: { listing: true } } } });
  let savedKg = 0, donations = 0;
  for (const o of delivered) {
    const kg = o.items.reduce((sum, it) => sum + (Number(it.qty) * (it.listing.weightGrams || 0)), 0) / 1000;
    savedKg += kg;
    if (o.type === 'DONATION') donations += 1;
  }
  const co2e = savedKg * CO2E_PER_KG;
  res.json({ totals: { ordersDelivered: delivered.length, foodSavedKg: Number(savedKg.toFixed(2)), co2eAvoidedKg: Number(co2e.toFixed(2)), donations } });
}));

router.get('/admin', ah(async (_req, res) => {
  const [users, providers, centers, activeListings, orders] = await Promise.all([
    prisma.user.count(),
    prisma.serviceProvider.count(),
    prisma.donationCenter.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count()
  ]);
  res.json({ users, providers, centers, activeListings, orders });
}));

router.get('/customer', requireAuth, ah(async (req: any, res) => {
  const userId = req.user.sub;
  const orders = await prisma.order.findMany({
    where: { customerId: userId, status: 'DELIVERED' },
    include: { items: { include: { listing: true } } }
  });

  let savedKg = 0;
  let moneySaved = 0;
  let totalSpent = 0;
  let donationCount = 0;

  for (const o of orders) {
    for (const it of o.items) {
      const kg = (it.qty * (it.listing.weightGrams || 500)) / 1000;
      savedKg += kg;
      const unitSaving = Number(it.listing.unitPrice) - Number(it.listing.discountPrice);
      moneySaved += (unitSaving * it.qty);
      totalSpent += (Number(it.listing.discountPrice) * it.qty);
    }
    if (o.type === 'DONATION') donationCount++;
  }

  res.json({
    ordersCount: orders.length,
    foodSavedKg: Number(savedKg.toFixed(2)),
    co2eAvoidedKg: Number((savedKg * CO2E_PER_KG).toFixed(2)),
    moneySaved: Number(moneySaved.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
    donationCount
  });
}));
