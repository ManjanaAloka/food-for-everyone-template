import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Password for all test accounts: "password123"
  const hash = await argon2.hash('password123');

  // 1. Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      name: 'Amal Perera',
      phone: '1234567890',
      passwordHash: hash,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Customer created:', customer.email);

  // 2. Create Service Provider
  const provider = await prisma.user.upsert({
    where: { email: 'provider@test.com' },
    update: {},
    create: {
      email: 'provider@test.com',
      name: 'Sunil Bakary',
      phone: '1234567891',
      passwordHash: hash,
      role: 'PROVIDER',
      status: 'ACTIVE'
    }
  });

  // Create ServiceProvider profile
  await prisma.serviceProvider.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      userId: provider.id,
      businessName: 'Sunil Fresh Foods',
      verifiedAt: new Date()
    }
  });
  console.log('✅ Service Provider created:', provider.email);

  // 3. Create Donation Center
  const center = await prisma.user.upsert({
    where: { email: 'center@test.com' },
    update: {},
    create: {
      email: 'center@test.com',
      name: 'Hope Foundation',
      phone: '1234567892',
      passwordHash: hash,
      role: 'DONATION_CENTER',
      status: 'ACTIVE'
    }
  });

  // Create DonationCenter profile
  await prisma.donationCenter.upsert({
    where: { userId: center.id },
    update: {},
    create: {
      userId: center.id,
      name: 'Hope Donation Center',
      verifiedAt: new Date()
    }
  });
  console.log('✅ Donation Center created:', center.email);

  // 4. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'System Admin',
      phone: '1234567893',
      passwordHash: hash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Admin created:', admin.email);

  console.log('\n🎉 Seeding completed!\n');
  console.log('📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@test.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Customer:');
  console.log('  Email: customer@test.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Service Provider:');
  console.log('  Email: provider@test.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Donation Center:');
  console.log('  Email: center@test.com');
  console.log('  Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
