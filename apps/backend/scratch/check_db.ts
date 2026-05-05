import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.refreshToken.count();
    console.log('Total RefreshTokens:', count);
    const active = await prisma.refreshToken.count({ where: { revoked: false } });
    console.log('Active RefreshTokens:', active);
  } catch (e) {
    console.error('Prisma Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
