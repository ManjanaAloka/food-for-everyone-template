import { PrismaClient } from '@prisma/client';

async function testConnection(url: string) {
  console.log('Testing URL:', url);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log('✅ Success!');
    return true;
  } catch (e) {
    console.error('❌ Failed:', e.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const urls = [
    'mysql://root:@localhost:3306/ffe',
    'mysql://root:root@localhost:3306/ffe'
  ];
  for (const url of urls) {
    if (await testConnection(url)) break;
  }
}

main();
