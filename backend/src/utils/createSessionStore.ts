import { SESSION_STORE } from '@config';
import { RedisStore } from 'connect-redis';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import createFileStore from 'session-file-store';
import { getRedisClient } from './initRedis';

export function createSessionStore(sessionTTL: number): session.Store {
  if (SESSION_STORE === 'redis') {
    return new RedisStore({
      client: getRedisClient(),
      ttl: sessionTTL,
    });
  }

  if (SESSION_STORE === 'memory') {
    const MemoryStore = createMemoryStore(session);
    // NOTE: memory store uses ms
    return new MemoryStore({ checkPeriod: sessionTTL * 1000 });
  }

  const FileStore = createFileStore(session);
  return new FileStore({ sessionTTL, path: './data/sessions' });
}
