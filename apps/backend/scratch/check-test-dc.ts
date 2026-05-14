import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'test_DC_6@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      donationCenterProfile: true,
      providerProfile: true,
      customerProfile: true
    }
  });

  console.log('User check result:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
