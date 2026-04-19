import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../utils/asyncHandler.js';
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
