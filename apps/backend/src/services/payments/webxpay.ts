import crypto from 'crypto';
import type { NormalizedWebhookEvent } from './types.js';

function hmacSha256(data: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').toUpperCase();
}
// TODO: Adjust field order to match your WebXpay docs
function buildSignatureBase(p: any) {
  const parts = [
    String(p.merchant_id ?? ''),
    String(p.order_id ?? ''),
    String(p.amount ?? p.payment_amount ?? ''),
    String(p.currency ?? 'LKR'),
    String(p.status ?? p.status_code ?? ''),
    String(p.payment_id ?? p.txn_id ?? '')
  ];
  return parts.join('');
}

export const webxpayProvider = {
  name: 'webxpay',
  async createCheckoutSession(_order: any) {
    return { redirectUrl: 'https://sandbox.webxpay.com' };
  },
  async verifyWebhook(req: any): Promise<NormalizedWebhookEvent> {
    const p = req.body || {};
    const providedSig = String(p.signature || p.hash || p.merchant_signature || '').toUpperCase();
    const devSkip = String(process.env.WEBXPAY_DEV_SKIP_VERIFY || '').toLowerCase() === 'true';

    if (!devSkip) {
      if (!providedSig) throw new Error('Missing signature');
      const secret = process.env.WEBXPAY_SECRET!;
      const base = buildSignatureBase(p);
      const expected = hmacSha256(base, secret);
      if (expected !== providedSig) throw new Error('Invalid signature');
    }

    const success =
      String(p.status || '').toUpperCase() === 'SUCCESS' ||
      String(p.status_code || '') === '2';

    if (success) {
      return { type: 'payment.succeeded', orderId: String(p.order_id || p.orderId), amount: Number(p.amount || p.payment_amount || 0), txnRef: String(p.payment_id || p.txn_id || 'unknown'), raw: p };
    }
    return { type: 'payment.failed', orderId: String(p.order_id || p.orderId), raw: p };
  }
};