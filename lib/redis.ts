import Redis from 'ioredis';

const getRedisUrl = (): string => {
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

const redisClientSingleton = () => {
  const client = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('[REDIS_ERROR] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[REDIS_INFO] Connected to Redis/Valkey cache server');
  });

  return client;
};

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: undefined | ReturnType<typeof redisClientSingleton>;
}

export const redis = globalThis.redisGlobal ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redis;
}

export default redis;
