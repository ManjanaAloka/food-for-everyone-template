import { sendMail } from './mailer.js';
export async function notifyEmail(to: string | null | undefined, subject: string, body: string) {
  if (!to) return;
  return sendMail(to, subject, body);
}