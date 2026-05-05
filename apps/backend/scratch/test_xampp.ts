import { PrismaClient } from '@prisma/client';

async function main() {
  const url = "mysql://root:@localhost:3306/ffe";
  console.log('Testing XAMPP MySQL URL:', url);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log('✅ Success!');
  } catch (e) {
    console.error('❌ Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
