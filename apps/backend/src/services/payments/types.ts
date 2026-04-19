export type NormalizedWebhookEvent =
  | { type: 'payment.succeeded'; orderId: string; amount: number; txnRef: string; raw: any }
  | { type: 'payment.failed'; orderId: string; raw: any };