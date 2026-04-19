import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'localhost',
  port: Number(process.env.MAIL_PORT || 1025),
  secure: false
});
export async function sendMail(to: string, subject: string, html: string) {
  if (!to) return;
  await transporter.sendMail({ from: process.env.MAIL_FROM || 'no-reply@ffe.local', to, subject, html });
}