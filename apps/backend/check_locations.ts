import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, lat: true, lng: true, createdAt: true }
  });
  
  console.log("Total orders in database:", orders.length);
  const withLocation = orders.filter(o => o.lat != null && o.lng != null);
  console.log("Orders WITH location data:", withLocation.length);
  
  if (withLocation.length === 0) {
    console.log("WARNING: None of the orders have location data (lat/lng). The heatmap will be empty.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
