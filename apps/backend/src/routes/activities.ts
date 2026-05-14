import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = Router();

// GET activities for a specific center
router.get('/center/:centerId', ah(async (req, res) => {
  const { centerId } = req.params;
  const activities = await prisma.donationCenterActivity.findMany({
    where: { centerId },
    orderBy: { createdAt: 'desc' },
    include: { request: { select: { title: true } } }
  });
  res.json({ activities });
}));

// POST a new activity (Donation Center only)
router.post('/', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const { title, content, images, requestId } = req.body;
  const centerId = req.user.sub;

  const activity = await prisma.donationCenterActivity.create({
    data: {
      centerId,
      title,
      content,
      images: images || [],
      requestId
    }
  });

  res.status(201).json({ activity });
}));

// DELETE an activity
router.delete('/:id', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const { id } = req.params;
  const centerId = req.user.sub;

  const activity = await prisma.donationCenterActivity.findUnique({ where: { id } });
  if (!activity || activity.centerId !== centerId) {
    return res.status(403).json({ error: 'Unauthorized to delete this activity' });
  }

  await prisma.donationCenterActivity.delete({ where: { id } });
  res.json({ success: true });
}));

// UPDATE an activity
router.patch('/:id', requireAuth, requireRole('DONATION_CENTER'), ah(async (req: any, res) => {
  const { id } = req.params;
  const { title, content, images } = req.body;
  const centerId = req.user.sub;

  const activity = await prisma.donationCenterActivity.findUnique({ where: { id } });
  if (!activity || activity.centerId !== centerId) {
    return res.status(403).json({ error: 'Unauthorized to update this activity' });
  }

  const updated = await prisma.donationCenterActivity.update({
    where: { id },
    data: { title, content, images }
  });

  res.json({ activity: updated });
}));
