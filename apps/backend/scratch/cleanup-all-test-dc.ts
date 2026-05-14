import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'test_DC_' } },
    select: { id: true }
  });

  const ids = users.map(u => u.id);

  if (ids.length > 0) {
    await prisma.donationCenter.deleteMany({ where: { userId: { in: ids } } });
    await prisma.serviceProvider.deleteMany({ where: { userId: { in: ids } } });
    await prisma.customerProfile.deleteMany({ where: { userId: { in: ids } } });
    const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log('Deleted orphaned test accounts and profiles:', result.count);
  } else {
    console.log('No test accounts found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
