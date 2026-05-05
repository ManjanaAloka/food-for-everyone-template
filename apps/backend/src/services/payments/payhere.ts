import crypto from 'crypto';
import type { NormalizedWebhookEvent } from './types.js';

function md5Upper(s: string) { return crypto.createHash('md5').update(s).digest('hex').toUpperCase(); }

export const payHereProvider = {
  name: 'payhere',
  async createCheckoutSession(order: any) {
    const base = process.env.PAYHERE_BASE || 'https://sandbox.payhere.lk';
    const url = `${base}/pay/checkout`;

    const merchant_id = process.env.PAYHERE_MERCHANT_ID!;
    const return_url = process.env.PAYHERE_RETURN_URL || process.env.PAYMENT_RETURN_URL!;
    const cancel_url = process.env.PAYHERE_CANCEL_URL || process.env.PAYMENT_CANCEL_URL!;
    const notify_url = process.env.PAYHERE_NOTIFY_URL || (process.env.APP_URL + '/api/payments/webhook/payhere');

    const amount = Number(order.total).toFixed(2);
    const currency = 'LKR';
    const items = `Surplus Food (${order.items?.length || 1} item)`;
    const fullName: string = order.buyer?.name || 'Customer';
    const [first_name, ...rest] = fullName.split(' ');
    const last_name = rest.join(' ') || 'â€”';

    const secretHash = md5Upper(process.env.PAYHERE_MERCHANT_SECRET!);
    const hash = md5Upper(merchant_id + order.id + amount + currency + secretHash);

    const fields: Record<string, string> = {
      merchant_id, return_url, cancel_url, notify_url,
      order_id: order.id, items, currency, amount, hash,
      first_name, last_name,
      email: order.buyer?.email || 'noreply@example.com',
      phone: order.buyer?.phone || '',
      address: order.addressLine || 'â€”',
      city: order.city || 'â€”',
      country: 'Sri Lanka'
    };
    return { method: 'POST', url, fields };
  },

  async verifyWebhook(req: any): Promise<NormalizedWebhookEvent> {
    const p = req.body || {};
    const merchant_id = String(p.merchant_id || '');
    const order_id = String(p.order_id || '');
    const payhere_amount = String(p.payhere_amount || '');
    const payhere_currency = String(p.payhere_currency || '');
    const status_code = String(p.status_code || p.status || '');
    const md5sig = String(p.md5sig || '').toUpperCase();

    const myMerchantId = process.env.PAYHERE_MERCHANT_ID!;
    const secretHash = md5Upper(process.env.PAYHERE_MERCHANT_SECRET!);

    const expected = md5Upper(merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash);

    if (!(merchant_id && order_id && payhere_amount && payhere_currency && status_code && md5sig)) throw new Error('Missing webhook fields');
    if (merchant_id !== myMerchantId) throw new Error('Merchant mismatch');
    if (expected !== md5sig) throw new Error('Invalid signature');

    if (status_code === '2') {
      return { type: 'payment.succeeded', orderId: order_id, amount: Number(payhere_amount), txnRef: String(p.payment_id || p.payhere_payment_id || 'unknown'), raw: p };
    }
    return { type: 'payment.failed', orderId: order_id, raw: p };
  }
};