import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');

  // 1. Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      passwordHash,
      role: 'CUSTOMER',
      name: 'Amal Perera',
      status: 'ACTIVE',
      customerProfile: { create: { address: '123 Main St, Colombo' } }
    }
  });

  // 2. Create Provider
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@test.com' },
    update: {},
    create: {
      email: 'provider@test.com',
      passwordHash,
      role: 'PROVIDER',
      name: 'Sunil Bakary',
      status: 'ACTIVE',
      providerProfile: { create: { businessName: 'Sunil Fresh Bakery', address: '45 Bakery Road, Kandy', city: 'Kandy' } }
    }
  });

  // 3. Create Listing
  const listing = await prisma.listing.create({
    data: {
      providerId: providerUser.id,
      title: 'Fresh Fish Buns',
      description: 'Delicious hot fish buns baked daily.',
      category: 'Bakery',
      unitPrice: 120,
      discountPrice: 100,
      qtyAvailable: 50,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h from now
      status: 'ACTIVE'
    }
  });

  // 4. Create Order
  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      providerId: providerUser.id,
      type: 'PERSONAL',
      fulfillmentMode: 'PICKUP',
      paymentMethod: 'COD',
      status: 'DELIVERED',
      subtotal: 500,
      total: 500,
      items: {
        create: {
          listingId: listing.id,
          providerId: providerUser.id,
          qty: 5,
          unitPrice: 100,
          snapshotExpiresAt: new Date()
        }
      }
    }
  });

  // 5. Create Review
  await prisma.review.upsert({
    where: { orderId: order.id },
    update: {},
    create: {
      orderId: order.id,
      reviewerId: customer.id,
      providerId: providerUser.id,
      rating: 5,
      comment: 'The buns were very fresh and delicious! Highly recommended.',
      status: 'APPROVED'
    }
  });

  console.log('✅ Sample review and data seeded successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
