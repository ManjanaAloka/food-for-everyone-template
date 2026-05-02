import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.serviceProvider.findMany({
    include: { user: { select: { status: true } } }
  });
  console.log("Providers:", JSON.stringify(providers, null, 2));

  const centers = await prisma.donationCenter.findMany({
    include: { user: { select: { status: true } } }
  });
  console.log("Centers:", JSON.stringify(centers, null, 2));
}

main();
