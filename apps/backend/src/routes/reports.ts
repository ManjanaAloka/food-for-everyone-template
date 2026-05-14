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
  const { from, to, listingId } = req.query;

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  const orders = await prisma.order.findMany({
    where: { 
      providerId: userId, 
      status: { in: ['PAID', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
      ...(from || to ? { createdAt: dateFilter } : {}),
      ...(listingId ? { items: { some: { listingId: listingId as string } } } : {})
    },
    include: { 
      items: { 
        include: { listing: true },
        // If we are filtering by a specific item, we might want to ONLY include those items in calculations
        // but typically users want to see "Orders containing this item" and the revenue from *that item*
      }, 
      provider: true 
    }
  });

  let savedKg = 0;
  let donationCount = 0;
  let totalRevenue = 0;

  // Analysis maps
  const itemSalesMap = new Map<string, { id: string; title: string; qty: number; revenue: number; dailyQty: Map<string, number> }>();
  const dailySalesMap = new Map<string, { count: number; revenue: number }>();
  const locationMap = new Map<string, number>();

  for (const o of orders) {
    const day = o.createdAt.toISOString().split('T')[0];
    
    // City logic: use order city, if missing use provider city (especially for pickup)
    let city = (o.city || '').trim();
    if (!city && o.provider?.city) {
      city = o.provider.city.trim();
    }
    if (!city) city = 'Other';
    
    let orderMatch = false;
    let orderRevenueFromTarget = 0;

    for (const it of o.items) {
      // If we are filtering by listingId, we only care about stats for THAT item
      if (listingId && it.listingId !== listingId) continue;
      
      orderMatch = true;
      const kg = (it.qty * (it.listing.weightGrams || 500)) / 1000;
      savedKg += kg;
      orderRevenueFromTarget += Number(it.unitPrice) * it.qty;

      // Item tracking
      const itemData = itemSalesMap.get(it.listingId) || { id: it.listingId, title: it.listing.title, qty: 0, revenue: 0, dailyQty: new Map() };
      itemData.qty += it.qty;
      itemData.revenue += Number(it.unitPrice) * it.qty;
      
      const currentDailyQty = itemData.dailyQty.get(day) || 0;
      itemData.dailyQty.set(day, currentDailyQty + it.qty);
      
      itemSalesMap.set(it.listingId, itemData);
    }

    if (orderMatch) {
       totalRevenue += orderRevenueFromTarget;
       
       // Daily tracking
       const daily = dailySalesMap.get(day) || { count: 0, revenue: 0 };
       daily.count++;
       daily.revenue += orderRevenueFromTarget;
       dailySalesMap.set(day, daily);

       // Location tracking
       locationMap.set(city, (locationMap.get(city) || 0) + 1);
       
       if (o.type === 'DONATION') donationCount++;
    }
  }

  const topSellingItems = Array.from(itemSalesMap.values())
    .map(item => {
      let peakDay = '';
      let maxQty = 0;
      for (const [day, qty] of item.dailyQty.entries()) {
        if (qty > maxQty) {
          maxQty = qty;
          peakDay = day;
        }
      }
      return { 
        id: item.id,
        title: item.title, 
        qty: item.qty, 
        revenue: item.revenue, 
        peakDay 
      };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const salesByDay = Array.from(dailySalesMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Day of Week Analysis
  const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekMap = new Map<string, number>();
  orders.forEach(o => {
    const dayName = dayOfWeekNames[o.createdAt.getDay()];
    dayOfWeekMap.set(dayName, (dayOfWeekMap.get(dayName) || 0) + 1);
  });
  const salesByDayOfWeek = dayOfWeekNames.map(name => ({ name, count: dayOfWeekMap.get(name) || 0 }));

  const topLocations = Array.from(locationMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const orderLocations = orders
    .filter(o => o.lat != null && o.lng != null)
    .map(o => ({ 
      id: o.id, 
      lat: Number(o.lat), 
      lng: Number(o.lng), 
      count: o.items.filter(it => !listingId || it.listingId === listingId).reduce((sum, it) => (Number(sum) + (Number(it.qty) || 0)), 0)
    }))
    .filter(o => o.count > 0);

  res.json({
    ordersCount: orders.length,
    foodSavedKg: Number(savedKg.toFixed(2)),
    co2eAvoidedKg: Number((savedKg * CO2E_PER_KG).toFixed(2)),
    donationCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    topSellingItems,
    salesByDay,
    salesByDayOfWeek,
    topLocations,
    orderLocations
  });
}));
