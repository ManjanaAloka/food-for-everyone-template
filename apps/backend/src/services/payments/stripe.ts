import Stripe from 'stripe';
import type { PaymentProvider } from './types.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
}) : null;

export const stripeProvider: PaymentProvider = {
  async createCheckoutSession(order) {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    const lineItems = order.items.map((item: any) => ({
      price_data: {
        currency: 'lkr',
        product_data: {
          name: item.listing?.title || 'Food Item',
          description: item.listing?.description || '',
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/checkout/success'}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/checkout/cancel'}?order_id=${order.id}`,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
      },
    });

    return {
      method: 'GET',
      url: session.url!,
      fields: {},
    };
  },

  async verifyWebhook(req) {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      throw new Error('Missing signature or webhook secret');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      return {
        type: 'payment.succeeded',
        orderId,
        txnRef: session.payment_intent as string,
        raw: event.data.object,
      };
    } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      return {
        type: 'payment.failed',
        orderId,
        raw: event.data.object,
      };
    }

    return { type: 'unknown', raw: event.data.object };
  },
};
