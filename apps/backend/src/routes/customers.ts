import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { z } from 'zod';

export const router = Router();

const updateProfileSchema = z.object({
  idNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  verificationDoc: z.any().optional(),
  name: z.string().optional(),
  phone: z.string().optional()
});

router.get('/me', requireAuth, requireRole('CUSTOMER'), ah(async (req: any, res) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: req.user!.sub },
    include: { user: true }
  });
  
  if (!profile) {
    // Create empty profile if not exists
    const newProfile = await prisma.customerProfile.create({
      data: { userId: req.user!.sub },
      include: { user: true }
    });
    return res.json({ profile: newProfile });
  }
  
  res.json({ profile });
}));

router.patch('/me', requireAuth, requireRole('CUSTOMER'), ah(async (req: any, res) => {
  const body = updateProfileSchema.parse(req.body);
  
  const { name, phone, ...profileData } = body;
  
  const updated = await prisma.$transaction(async (tx) => {
    if (name || phone) {
      await tx.user.update({
        where: { id: req.user!.sub },
        data: { name, phone }
      });
    }
    
    return tx.customerProfile.update({
      where: { userId: req.user!.sub },
      data: profileData,
      include: { user: true }
    });
  });
  
  res.json({ profile: updated });
}));

// ─── Payment Methods ──────────────────────────────────────────────────────────

router.get('/payment-methods', requireAuth, requireRole('CUSTOMER'), ah(async (req: any, res) => {
  const methods = await prisma.savedPaymentMethod.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ methods });
}));

router.post('/payment-methods', requireAuth, requireRole('CUSTOMER'), ah(async (req: any, res) => {
  const { cardType, last4, expiry } = z.object({
    cardType: z.string(),
    last4: z.string().length(4),
    expiry: z.string()
  }).parse(req.body);

  // In a real app, we would call Stripe/PayHere here to get a token
  const mockToken = `tok_${Math.random().toString(36).substring(7)}`;

  const method = await prisma.savedPaymentMethod.create({
    data: {
      userId: req.user!.sub,
      cardType,
      last4,
      expiry,
      token: mockToken,
      isDefault: (await prisma.savedPaymentMethod.count({ where: { userId: req.user!.sub } })) === 0
    }
  });

  res.json({ method });
}));

router.delete('/payment-methods/:id', requireAuth, requireRole('CUSTOMER'), ah(async (req: any, res) => {
  const { id } = req.params;
  const method = await prisma.savedPaymentMethod.findUnique({ where: { id } });
  if (!method) return res.status(404).json({ error: 'Not found' });
  if (method.userId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });

  await prisma.savedPaymentMethod.delete({ where: { id } });
  res.json({ ok: true });
}));

