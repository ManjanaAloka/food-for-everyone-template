import { sendMail } from './mailer.js';
import { prisma } from '../lib/prisma.js';

export async function notifyEmail(to: string | null | undefined, subject: string, body: string) {
  if (!to) return;
  try {
    return await sendMail(to, subject, body);
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }
}

export async function createNotification(userId: string, type: string, channel: string, payload: any) {
  return prisma.notification.create({
    data: { userId, type, channel, payload }
  });
}