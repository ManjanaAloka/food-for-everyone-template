import { payHereProvider } from './payhere.js';
import { webxpayProvider } from './webxpay.js';
import { stripeProvider } from './stripe.js';

export function getPaymentProvider(name?: string) {
  const p = (name || process.env.PAYMENT_PROVIDER || 'payhere').toLowerCase();
  if (p === 'webxpay') return webxpayProvider;
  if (p === 'stripe') return stripeProvider;
  return payHereProvider;
}
