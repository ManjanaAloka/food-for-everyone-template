import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('Testing DATABASE_URL from .env:', url);
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connection Successful!');
    const users = await prisma.user.count();
    console.log('Total users in DB:', users);
  } catch (e) {
    console.error('❌ Connection Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
