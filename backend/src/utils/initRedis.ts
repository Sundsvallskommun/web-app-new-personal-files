import { createClient, RedisClientType } from 'redis';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, SESSION_STORE } from '@config';
import { logger } from '@utils/logger';

let client: RedisClientType | null = null;

export async function initRedis(): Promise<void> {
  if (SESSION_STORE !== 'redis') {
    return;
  }

  if (!REDIS_HOST) {
    throw new Error('SESSION_STORE=redis but REDIS_HOST is not set');
  }

  if (client) {
    return;
  }

  client = createClient({
    socket: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT || 6379),
      reconnectStrategy: retries => Math.min(retries * 100, 3000),
    },
    password: REDIS_PASSWORD,
  });

  client.on('error', err => logger.error(`Redis client error: ${(err as Error).message}`));
  client.on('reconnecting', () => logger.warn('Redis reconnecting'));
  client.on('ready', () => logger.info('Redis ready'));
  client.on('end', () => logger.warn('Redis connection closed'));

  try {
    await client.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Failed to connect to Redis', err);
    client = null;
    throw err;
  }
}

export function getRedisClient(): RedisClientType {
  if (!client) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return client;
}
