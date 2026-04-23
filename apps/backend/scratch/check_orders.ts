import { prisma } from '../src/lib/prisma.js';

async function checkOrders() {
  const orders = await prisma.order.findMany({ take: 2 });
  console.log("Orders:", JSON.stringify(orders, null, 2));
}

checkOrders().catch(console.error).finally(() => prisma.$disconnect());
