import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';
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
  beneficiariesCount: z.coerce.number().optional(),

  // Location
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional()
});

router.post('/register', ah(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const hash = await argon2.hash(data.password);
  const status = data.role === 'CUSTOMER' ? 'ACTIVE' : 'PENDING';
  const phone = data.phone && data.phone.trim() !== '' ? data.phone : undefined;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, phone, passwordHash: hash, role: data.role as any, status }
      });

      if (data.role === 'PROVIDER') {
        await tx.serviceProvider.create({ 
          data: { 
            userId: user.id, 
            businessName: data.businessName || data.name,
            brNo: data.brNo,
            address: data.address,
            city: data.city,
            lat: data.lat,
            lng: data.lng,
            openHours: data.openHours,
            businessType: data.businessType,
            contactPerson: data.contactPerson
          } 
        });
      } else if (data.role === 'DONATION_CENTER') {
        await tx.donationCenter.create({ 
          data: { 
            userId: user.id, 
            name: data.centerName || data.name,
            centerType: data.centerType,
            registrationNo: data.brNo,
            contactPerson: data.contactPerson,
            phone: data.phone,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            beneficiariesCount: data.beneficiariesCount
          } 
        });
      } else if (data.role === 'CUSTOMER') {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            address: data.address,
            city: data.city,
            lat: data.lat,
            lng: data.lng
          }
        });
      }
      return user;
    });

    res.json({ id: result.id, status: result.status });

    // ─── NOTIFY ADMINS ─────────────────────────────────────────────────────────
    if (status === 'PENDING') {
      try {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SYSTEM_ADMIN'] } },
          select: { id: true }
        });

        if (admins.length > 0) {
          const type = data.role === 'PROVIDER' ? 'NEW_PROVIDER' : 'NEW_DONATION_CENTER';
          const title = data.role === 'PROVIDER' ? 'New Provider Registration' : 'New Donation Center Registration';
          const name = data.role === 'PROVIDER' ? (data.businessName || data.name) : (data.centerName || data.name);

          await prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              type: type,
              channel: 'IN_APP',
              payload: {
                title: title,
                message: `${name} has registered and is awaiting your approval.`,
                userId: result.id,
                role: data.role
              }
            }))
          });
          
          const io = (global as any).__io;
          if (io) {
            admins.forEach(admin => {
              io.to(`user:${admin.id}`).emit('notification', {
                type,
                title,
                message: `${name} is awaiting approval.`
              });
            });
          }
        }
      } catch (error) {
        console.error('Error sending admin notifications:', error);
      }
    }
  } catch (err: any) {
    console.error('Registration Transaction Error:', err);
    if (err.code === 'P2002') {
      const field = err.meta?.target || 'field';
      return res.status(400).json({ error: `A user with this ${field} already exists.` });
    }
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.passwordHash, password))) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status === 'PENDING' && user.role !== 'CUSTOMER') return res.status(403).json({ error: 'Awaiting admin approval' });

  const fullUser = await prisma.user.findUnique({ 
    where: { id: user.id },
    include: {
      providerProfile: { select: { businessName: true } },
      donationCenterProfile: { select: { name: true } }
    }
  });

  const displayName = fullUser?.providerProfile?.businessName || fullUser?.donationCenterProfile?.name || user.name;

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: displayName });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await argon2.hash(refreshToken);
  const ttl = process.env.REFRESH_TOKEN_TTL || '30d';
  const ttlMs = typeof ttl === 'string' && ttl.endsWith('d') ? parseInt(ttl) * 24 * 60 * 60 * 1000 : Number(ttl) || 2592000000;
  const expires = new Date(Date.now() + ttlMs);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt: expires } });

  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, expires });
  res.json({ accessToken, user: { id: user.id, role: user.role, name: displayName, status: user.status, permissions: user.permissions, forcePasswordChange: user.forcePasswordChange } });
}));

router.post('/refresh', ah(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  const all = await prisma.refreshToken.findMany({ where: { revoked: false }, take: 50, orderBy: { createdAt: 'desc' }});
  let rt: any = null;
  for (const r of all) { if (await argon2.verify(r.tokenHash, token)) { rt = r; break; } }
  if (!rt || rt.expiresAt < new Date()) return res.status(401).json({ error: 'Invalid refresh token' });

  const user = await prisma.user.findUnique({ 
    where: { id: rt.userId },
    include: {
      providerProfile: { select: { businessName: true } },
      donationCenterProfile: { select: { name: true } }
    }
  });
  if (!user) return res.status(401).json({ error: 'User not found' });
  const displayName = user.providerProfile?.businessName || user.donationCenterProfile?.name || user.name;
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: displayName });
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

router.post('/change-password', requireAuth, ah(async (req: any, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6)
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
    return res.status(401).json({ error: 'Invalid current password' });
  }

  const hash = await argon2.hash(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      passwordHash: hash,
      forcePasswordChange: false 
    }
  });

  res.json({ ok: true });
}));
