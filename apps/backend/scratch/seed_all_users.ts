import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');

  // 1. Admin
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash,
      role: 'ADMIN',
      name: 'System Admin',
      status: 'ACTIVE'
    }
  });

  // 2. Customer
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      passwordHash,
      role: 'CUSTOMER',
      name: 'Test Customer',
      status: 'ACTIVE',
      customerProfile: { create: { address: 'Customer Address' } }
    }
  });

  // 3. Service Provider
  await prisma.user.upsert({
    where: { email: 'provider@test.com' },
    update: {},
    create: {
      email: 'provider@test.com',
      passwordHash,
      role: 'PROVIDER',
      name: 'Test Provider',
      status: 'ACTIVE',
      providerProfile: { create: { businessName: 'Test Bakery', address: 'Provider Address', city: 'Colombo' } }
    }
  });

  // 4. Donation Center
  await prisma.user.upsert({
    where: { email: 'center@test.com' },
    update: {},
    create: {
      email: 'center@test.com',
      passwordHash,
      role: 'DONATION_CENTER',
      name: 'Test Center',
      status: 'ACTIVE',
      donationCenterProfile: { create: { name: 'Hope Center', address: 'Center Address' } }
    }
  });

  console.log('✅ All test accounts seeded successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
