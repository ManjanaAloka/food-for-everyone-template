import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const [users, providers, orders, donations] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.serviceProvider.findMany(),
    prisma.order.findMany(),
    prisma.donationRequest.findMany()
  ]);

  console.log('Stats Overview:');
  console.log('Users by Role:', users);
  console.log('Providers:', providers.length);
  console.log('Orders:', orders.length, 'Statuses:', [...new Set(orders.map(o => o.status))]);
  console.log('Donations:', donations.length);
  
  const deliveredTotal = orders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + Number(o.total), 0);
  console.log('Delivered Orders Total Revenue:', deliveredTotal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
