import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.siteReview.findMany({
    include: { user: true }
  });
  console.log('Site Reviews:', JSON.stringify(reviews, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
