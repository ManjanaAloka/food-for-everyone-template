import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.donationCenterActivity.findMany({
    include: { center: true }
  });
  console.log('Total activities:', activities.length);
  console.log(JSON.stringify(activities, null, 2));
}

main();
