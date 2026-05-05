import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../utils/tokens.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'DONATION_CENTER']),
  
  // Customer specific
  address: z.string().optional(),
  city: z.string().optional(),
  
  // Provider specific
  businessName: z.string().optional(),
  brNo: z.string().optional(),
  openHours: z.string().optional(),
  businessType: z.string().optional(),
  contactPerson: z.string().optional(),
  
  // Donation Center specific
  centerName: z.string().optional(),
  centerType: z.string().optional(),
  beneficiariesCount: z.coerce.number().optional()
});

router.post('/register', ah(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const hash = await argon2.hash(data.password);
  const status = data.role === 'CUSTOMER' ? 'ACTIVE' : 'PENDING';
  // Only include phone if it has a value (not empty string)
  const phone = data.phone && data.phone.trim() !== '' ? data.phone : undefined;
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, phone, passwordHash: hash, role: data.role as any, status }
  });

  if (data.role === 'PROVIDER') {
    await prisma.serviceProvider.create({ 
      data: { 
        userId: user.id, 
        businessName: data.businessName || data.name,
        brNo: data.brNo,
        address: data.address,
        city: data.city,
        openHours: data.openHours,
        businessType: data.businessType,
        contactPerson: data.contactPerson
      } 
    });
  } else if (data.role === 'DONATION_CENTER') {
    await prisma.donationCenter.create({ 
      data: { 
        userId: user.id, 
        name: data.centerName || data.name,
        centerType: data.centerType,
        contactPerson: data.contactPerson,
        phone: data.phone,
        address: data.address,
        city: data.city,
        beneficiariesCount: data.beneficiariesCount
      } 
    });
  } else if (data.role === 'CUSTOMER') {
    await prisma.customerProfile.create({
      data: {
        userId: user.id,
        address: data.address,
        city: data.city
      }
    });
  }

  res.json({ id: user.id, status: user.status });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.passwordHash, password))) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status === 'PENDING' && user.role !== 'CUSTOMER') return res.status(403).json({ error: 'Awaiting admin approval' });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await argon2.hash(refreshToken);
  const ttl = process.env.REFRESH_TOKEN_TTL || '30d';
  const ttlMs = typeof ttl === 'string' && ttl.endsWith('d') ? parseInt(ttl) * 24 * 60 * 60 * 1000 : Number(ttl) || 2592000000;
  const expires = new Date(Date.now() + ttlMs);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt: expires } });

  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, expires });
  res.json({ accessToken, user: { id: user.id, role: user.role, name: user.name, status: user.status } });
}));

router.post('/refresh', ah(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  const all = await prisma.refreshToken.findMany({ where: { revoked: false }, take: 50, orderBy: { createdAt: 'desc' }});
  let rt: any = null;
  for (const r of all) { if (await argon2.verify(r.tokenHash, token)) { rt = r; break; } }
  if (!rt || rt.expiresAt < new Date()) return res.status(401).json({ error: 'Invalid refresh token' });

  const user = await prisma.user.findUnique({ where: { id: rt.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  res.json({ accessToken });
}));

router.post('/logout', ah(async (req, res) => {
  const token = req.cookies?.refresh_token;
  
  if (token) {
    try {
      // Find the specific token to revoke. 
      // Note: In a high-traffic app, we'd store the token ID in the cookie to avoid argon2.verify on many records.
      // For now, we take the last 50 active tokens (most likely to be the current one) to limit the search.
      const recentTokens = await prisma.refreshToken.findMany({ 
        where: { revoked: false },
        orderBy: { createdAt: 'desc' },
        take: 50 
      });

      for (const r of recentTokens) {
        if (await argon2.verify(r.tokenHash, token)) {
          await prisma.refreshToken.update({ where: { id: r.id }, data: { revoked: true } });
          break;
        }
      }
    } catch (error) {
      // Log the error but don't fail the logout request
      console.error('Error revoking token during logout:', error);
    }
  }

  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', secure: false });
  res.json({ ok: true });
}));
