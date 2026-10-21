import { HttpException } from '@/exceptions/HttpException';
import { apiURL } from '@/utils/util';
import axios, { AxiosRequestConfig } from 'axios';
import { createApiTokenService } from './api-token.service';
import { IApiTokenService } from '@/interfaces/api-token.interface';
import { User } from '@/interfaces/users.interface';
import { logger } from '@utils/logger';
import { maskIdentifiers } from '@utils/mask';

class ApiResponse<T> {
  data!: T;
  message!: string;
}

let apiTokenService: IApiTokenService | null = null;

function getApiTokenService(): IApiTokenService {
  if (!apiTokenService) {
    apiTokenService = createApiTokenService();
  }
  return apiTokenService;
}

/** Upstream error bodies vary by API; these are the fields the gateway APIs actually populate. */
interface UpstreamErrorBody {
  detail?: string;
  title?: string;
  message?: string;
}

export const buildSentBy = (username: string): string => `type=adAccount; ${username}`;

const loggablePath = (config: AxiosRequestConfig): string =>
  `${String(config.method ?? '').toUpperCase()} ${maskIdentifiers((config.url ?? '').split('?')[0])}`;

class ApiService {
  private async request<T>(config: AxiosRequestConfig, user?: User): Promise<ApiResponse<T>> {
    const token = await getApiTokenService().getToken();

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(user?.username ? { 'X-Sent-By': buildSentBy(user.username) } : {}),
    };
    const defaultParams = {};

    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: { ...defaultHeaders, ...config.headers },
      params: { ...defaultParams, ...config.params },
      url: apiURL(config.url ? config.url : ''),
    };

    try {
      const res = await axios(preparedConfig);
      return { data: res.data, message: 'success' };
    } catch (error: unknown) {
      throw this.toHttpException(error, preparedConfig);
    }
  }

  private toHttpException(error: unknown, config: AxiosRequestConfig): HttpException {
    if (!axios.isAxiosError(error) || !error.response) {
      // NOTE: did you subscribe to the API called?
      logger.error(`Upstream ${loggablePath(config)} failed with no response`);
      return new HttpException(500, 'Internal server error from gateway');
    }

    const { status, data } = error.response;

    logger.error(`Upstream ${loggablePath(config)} -> ${status}`);

    if (status === 404) {
      return new HttpException(404, 'Not found');
    }

    const body = data as UpstreamErrorBody | undefined;
    const message = body?.detail ?? body?.title ?? body?.message ?? error.message;

    return new HttpException(status, message);
  }

  public async get<T>(config: AxiosRequestConfig, user?: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' }, user);
  }

  public async post<T>(config: AxiosRequestConfig, user?: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' }, user);
  }

  public async patch<T>(config: AxiosRequestConfig, user?: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' }, user);
  }

  public async delete<T>(config: AxiosRequestConfig, user?: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' }, user);
  }
}

export default ApiService;
