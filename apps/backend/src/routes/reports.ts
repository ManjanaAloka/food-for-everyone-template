import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
export const router = Router();

const CO2E_PER_KG = 2.5;

router.get('/public', ah(async (_req, res) => {
  const orders = await prisma.order.findMany({ 
    where: { status: { in: ['PAID', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] } }, 
    include: { items: { include: { listing: true } } } 
  });
  
  const monetaryDonations = await prisma.donation.findMany({
    where: { status: 'SUCCEEDED' }
  });

  let savedKg = 0;
  let donationCount = 0;
  
  for (const o of orders) {
    const kg = o.items.reduce((sum, it) => sum + (Number(it.qty) * (it.listing.weightGrams || 500)), 0) / 1000;
    savedKg += kg;
    if (o.type === 'DONATION') donationCount++;
  }

  // Also count monetary donations as "Meals Donated" (estimated 1 meal per 400 LKR or similar, but let's just count transactions for now or use qty if we have it)
  // For simplicity, let's count donation-type orders + number of monetary donations
  const totalDonations = donationCount + monetaryDonations.length;

  const co2e = savedKg * CO2E_PER_KG;
  res.json({ 
    totals: { 
      ordersDelivered: orders.length, 
      foodSavedKg: Number(savedKg.toFixed(2)), 
      co2eAvoidedKg: Number(co2e.toFixed(2)), 
      donations: totalDonations 
    } 
  });
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
  const { from, to } = req.query;

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  const orders = await prisma.order.findMany({
    where: { 
      buyerId: userId, 
      status: { in: ['PAID', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
      ...(from || to ? { createdAt: dateFilter } : {})
    },
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

  // Monetary Donations
  const donations = await prisma.donation.findMany({
    where: { 
      customerId: userId, 
      status: 'SUCCEEDED',
      ...(from || to ? { createdAt: dateFilter } : {})
    }
  });
  const totalDonationsAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  res.json({
    ordersCount: orders.length,
    foodSavedKg: Number(savedKg.toFixed(2)),
    co2eAvoidedKg: Number((savedKg * CO2E_PER_KG).toFixed(2)),
    moneySaved: Number(moneySaved.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
    donationCount,
    totalDonationsAmount: Number(totalDonationsAmount.toFixed(2))
  });
}));

router.get('/provider', requireAuth, ah(async (req: any, res) => {
  const userId = req.user.sub;
  const { from, to } = req.query;

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  const orders = await prisma.order.findMany({
    where: { 
      providerId: userId, 
      status: { in: ['PAID', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
      ...(from || to ? { createdAt: dateFilter } : {})
    },
    include: { items: { include: { listing: true } } }
  });

  let savedKg = 0;
  let donationCount = 0;

  for (const o of orders) {
    for (const it of o.items) {
      const kg = (it.qty * (it.listing.weightGrams || 500)) / 1000;
      savedKg += kg;
    }
    if (o.type === 'DONATION') donationCount++;
  }

  res.json({
    ordersCount: orders.length,
    foodSavedKg: Number(savedKg.toFixed(2)),
    co2eAvoidedKg: Number((savedKg * CO2E_PER_KG).toFixed(2)),
    donationCount,
    // For providers, "moneySaved" isn't exactly applicable in the same way, 
    // but we can return total sales or similar if needed. 
    // For now, let's keep it consistent with the frontend fields.
    moneySaved: 0, 
    totalDonationsAmount: 0 
  });
}));
