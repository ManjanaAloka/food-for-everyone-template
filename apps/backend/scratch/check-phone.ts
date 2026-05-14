import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const phone = '+94754586899';
  const users = await prisma.user.findMany({
    where: { phone },
    include: {
      donationCenterProfile: true,
      providerProfile: true,
      customerProfile: true
    }
  });

  console.log('Phone check result:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
