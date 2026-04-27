import { NODE_ENV, SESSION_STORE } from '@config';
import { MemoryApiTokenService } from './api-token-service/memory-api-token.service';
import { RedisApiTokenService } from './api-token-service/redis-api-token.service';
import { IApiTokenService } from '../interfaces/api-token.interface';

export function createApiTokenService(): IApiTokenService {
  if (NODE_ENV === 'production' && SESSION_STORE === 'redis') {
    return new RedisApiTokenService();
  }

  return new MemoryApiTokenService();
}
