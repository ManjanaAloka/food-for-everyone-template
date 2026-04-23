import Redis from 'ioredis';

const isEnabled = process.env.REDIS_ENABLED === 'true';

export const redis = isEnabled 
  ? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null })
  : { options: {} } as any;
