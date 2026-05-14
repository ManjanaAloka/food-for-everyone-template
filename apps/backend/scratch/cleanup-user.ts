import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'test_DC_3@gmail.com';
  await prisma.user.deleteMany({
    where: { 
      email,
      donationCenterProfile: null,
      providerProfile: null,
      customerProfile: null
    }
  });
  console.log('Cleanup successful for:', email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
