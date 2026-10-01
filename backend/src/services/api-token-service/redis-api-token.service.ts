import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@utils/logger';
import { getRedisClient } from '@/utils/initRedis';
import { IApiTokenService } from '../../interfaces/api-token.interface';
import { fetchApiToken } from '@/utils/fetchToken';

const TOKEN_KEY = 'api_token';
const LOCK_KEY = 'api_token_lock';

export class RedisApiTokenService implements IApiTokenService {
  private get redis() {
    return getRedisClient();
  }

  async getToken(): Promise<string> {
    try {
      const cached = (await this.redis.get(TOKEN_KEY)) as string | null;
      if (cached) return cached;

      const lock = await this.redis.set(LOCK_KEY, '1', { NX: true, EX: 10 });

      if (lock === 'OK') {
        try {
          const token = await this.fetchTokenFromApi();
          await this.redis.set(TOKEN_KEY, token.access_token, {
            EX: token.expires_in - 10,
          });
          return token.access_token;
        } finally {
          await this.redis.del(LOCK_KEY).catch(err => logger.warn(`Failed to release token lock: ${(err as Error).message}`));
        }
      }

      const waited = await this.waitForToken();
      if (waited) return waited;

      throw new HttpException(500, 'Token fetch failed');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.warn(`[REDIS] token path failed, falling back to direct fetch: ${(err as Error).message}`);
      const token = await this.fetchTokenFromApi();
      return token.access_token;
    }
  }

  private async waitForToken(timeoutMs = 10000): Promise<string | null> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const token = (await this.redis.get(TOKEN_KEY)) as string | null;
      if (token) return token;
      await new Promise(r => setTimeout(r, 300));
    }

    return null;
  }

  private async fetchTokenFromApi() {
    logger.info('[REDIS] fetching oauth API token');
    return fetchApiToken();
  }
}
