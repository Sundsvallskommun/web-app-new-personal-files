import { logger } from '@utils/logger';
import { IApiTokenService } from '../../interfaces/api-token.interface';
import { fetchApiToken } from '@/utils/fetchToken';

export interface Token {
  access_token: string;
  expires_in: number;
}

let c_access_token = '';
let c_token_expires = 0;

export class MemoryApiTokenService implements IApiTokenService {
  public async getToken(): Promise<string> {
    if (Date.now() >= c_token_expires) {
      logger.info('[MEMORY] Getting oauth API token');
      await this.fetchToken();
    }
    return c_access_token;
  }

  private async setToken(token: Token) {
    c_access_token = token.access_token;
    c_token_expires = Date.now() + (token.expires_in * 1000 - 10000);
  }

  private async fetchToken(): Promise<void> {
    const token = await fetchApiToken();
    await this.setToken(token);
  }
}
