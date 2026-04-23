import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { Server } from 'socket.io';

const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

export let expiryQueue: Queue | null = isRedisEnabled 
  ? new Queue('listing-expiry', { connection: redis.options as any })
  : null;

export async function scheduleExpiry(listingId: string, when: Date) {
  if (!expiryQueue) return;
  const delay = Math.max(0, when.getTime() - Date.now());
  await expiryQueue.add('expire', { listingId }, { delay, removeOnComplete: true, removeOnFail: true });
}

export async function initQueues(io: Server) {
  if (isRedisEnabled) {
    new Worker('listing-expiry', async (job: Job) => {
      const { listingId } = job.data as { listingId: string };
      const l = await prisma.listing.findUnique({ where: { id: listingId }});
      if (!l) return;
      if (l.expiresAt <= new Date() || l.qtyAvailable <= 0) {
        await prisma.listing.update({ where: { id: listingId }, data: { status: 'EXPIRED' }});
        io.emit('listing:update', { id: listingId, status: 'EXPIRED' });
      }
    }, { connection: redis.options as any });
  }

  setInterval(async () => {
    const expired = await prisma.listing.updateMany({
      where: { status: 'ACTIVE', OR: [{ expiresAt: { lte: new Date() } }, { qtyAvailable: { lte: 0 } }] },
      data: { status: 'EXPIRED' }
    });
    if (expired.count) io.emit('listings:refresh', {});
  }, 60_000);
}