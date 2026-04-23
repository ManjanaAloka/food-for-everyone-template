import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

export const router = Router();

// ─── GET my notifications ─────────────────────────────────────────────────────
router.get('/', requireAuth, ah(async (req: any, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.sub, readAt: null }
  });
  res.json({ notifications, unreadCount });
}));

// ─── MARK a notification as read ─────────────────────────────────────────────
router.post('/:id/read', requireAuth, ah(async (req: any, res) => {
  const { id } = req.params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return res.status(404).json({ error: 'Not found' });
  if (notif.userId !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  res.json({ ok: true });
}));

// ─── MARK all as read ────────────────────────────────────────────────────────
router.post('/read-all', requireAuth, ah(async (req: any, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.sub, readAt: null },
    data: { readAt: new Date() }
  });
  res.json({ ok: true });
}));
