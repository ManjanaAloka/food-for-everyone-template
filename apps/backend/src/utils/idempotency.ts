import crypto from 'crypto';
export function hashIdempotencyKey(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}