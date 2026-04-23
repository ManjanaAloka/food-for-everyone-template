import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const listings = await prisma.listing.findMany({ include: { provider: true } });
  console.log(JSON.stringify(listings, null, 2));
}
main();
