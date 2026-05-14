import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const data = {
    name: 'test_DC_6',
    email: 'test_DC_6@gmail.com',
    phone: '+94754586899',
    password: 'password123',
    role: 'DONATION_CENTER',
    centerName: 'test_DC_6',
    centerType: 'NGO / Community Center',
    brNo: '234234',
    beneficiariesCount: 30,
    address: '27/8, malapalawila watta, amalagoda, Akuressa',
    lat: 6.0898,
    lng: 80.4761
  };

  try {
    const hash = await argon2.hash(data.password);
    const status = 'PENDING';
    
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { 
          name: data.name, 
          email: data.email, 
          phone: data.phone, 
          passwordHash: hash, 
          role: data.role as any, 
          status 
        }
      });

      await tx.donationCenter.create({ 
        data: { 
          userId: user.id, 
          name: data.centerName || data.name,
          centerType: data.centerType,
          registrationNo: data.brNo,
          phone: data.phone,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          beneficiariesCount: data.beneficiariesCount
        } 
      });
      return user;
    });

    console.log('Test Registration Successful:', result.id);
  } catch (err: any) {
    console.error('Test Registration FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
