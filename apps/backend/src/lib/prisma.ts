import { PrismaClient } from '@prisma/client';

// Initialize PrismaClient
// Use only 1 connection in whole backend
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Check database connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((e) => console.error('❌ Database connection error:', e));
