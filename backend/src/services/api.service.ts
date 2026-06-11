import { HttpException } from '@/exceptions/HttpException';
import { apiURL } from '@/utils/util';
import { logger } from '@/utils/logger';
import { ttlCache } from '@/utils/ttl-cache';
import axios, { AxiosRequestConfig } from 'axios';
import { createApiTokenService } from './api-token.service';
import { IApiTokenService } from '@/interfaces/api-token.interface';
import { User } from '@/interfaces/users.interface';

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

let gatewayThrottledUntil = 0;

const THROTTLE_FALLBACK_MS = 60_000; // if we can't parse nextAccessTime, back off ~1 min (observed reset cadence)
const THROTTLE_MAX_MS = 5 * 60_000; // never lock ourselves out longer than this from a bad/absurd timestamp

const isGatewayThrottled = (): boolean => Date.now() < gatewayThrottledUntil;

const computeThrottledUntil = (body: unknown): number => {
  const now = Date.now();
  const raw = (body as { nextAccessTime?: unknown } | undefined)?.nextAccessTime;
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw.replace(/UTC/i, '').trim());
    if (!Number.isNaN(parsed) && parsed > now) {
      return Math.min(parsed, now + THROTTLE_MAX_MS);
    }
  }
  return now + THROTTLE_FALLBACK_MS;
};

class ApiService {
  static get<T>(arg0: { url: string }) {
    throw new Error('Method not implemented.');
  }
  private static readonly inflight = new Map<string, Promise<ApiResponse<unknown>>>();

  private async request<T>(
    config: AxiosRequestConfig,
    cacheTtl?: number,
    coalesce = false,
    staleCacheOnly = false,
  ): Promise<ApiResponse<T>> {
    const url = apiURL(config.url ? config.url : '');

    let dedupeKey: string | null = null;
    if (cacheTtl || coalesce) {
      dedupeKey = `${config.method}:${url}:${JSON.stringify(config.params ?? {})}:${JSON.stringify(config.data ?? {})}`;
    }

    if (dedupeKey) {
      if (cacheTtl && !staleCacheOnly) {
        const cached = ttlCache.get<ApiResponse<T>>(dedupeKey);
        if (cached) return cached;
      }
      const pending = ApiService.inflight.get(dedupeKey) as Promise<ApiResponse<T>> | undefined;
      if (pending) return pending;
    }

    const exec = this.performRequest<T>(config, url, cacheTtl ? dedupeKey : null, cacheTtl);

    if (dedupeKey) {
      ApiService.inflight.set(dedupeKey, exec);
      const clearInflight = () => {
        if (ApiService.inflight.get(dedupeKey) === exec) ApiService.inflight.delete(dedupeKey);
      };
      exec.then(clearInflight, clearInflight);
    }

    return exec;
  }

  private async performRequest<T>(
    config: AxiosRequestConfig,
    url: string,
    cacheKey: string | null,
    cacheTtl?: number,
  ): Promise<ApiResponse<T>> {
    if (isGatewayThrottled()) {
      const stale = this.serveStale<T>(cacheKey, config.method, url);
      if (stale) return stale;
      throw new HttpException(429, 'Upstream temporarily throttled, please retry shortly');
    }

    const token = await getApiTokenService().getToken();

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const defaultParams = {};

    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: { ...defaultHeaders, ...config.headers },
      params: { ...defaultParams, ...config.params },
      url,
    };

    try {
      const res = await axios(preparedConfig);
      const result = { data: res.data, message: 'success' };
      if (cacheKey && cacheTtl) ttlCache.set(cacheKey, result, cacheTtl);
      return result;
    } catch (error: unknown) {
      return this.handleUpstreamError<T>(error, cacheKey, preparedConfig.method, preparedConfig.url);
    }
  }

  private serveStale<T>(cacheKey: string | null, method?: string, url?: string): ApiResponse<T> | null {
    if (!cacheKey) return null;
    const stale = ttlCache.getStale<ApiResponse<T>>(cacheKey);
    if (!stale) return null;
    logger.warn(`Gateway throttled — serving stale cache for ${method} ${url}`);
    return stale;
  }

  private handleUpstreamError<T>(
    error: unknown,
    cacheKey: string | null,
    method?: string,
    url?: string,
  ): ApiResponse<T> {
    if (!axios.isAxiosError(error) || !error.response) {
      logger.error(`Upstream ${method} ${url} -> no response: ${String(error)}`);
      throw new HttpException(502, 'No response from gateway');
    }

    const status = error.response.status;
    const body = error.response.data;
    const upstreamMessage =
      (body as { message?: string; title?: string } | undefined)?.message ??
      (body as { title?: string } | undefined)?.title ??
      error.message;
    logger.error(
      `Upstream ${method} ${url} -> ${status}: ${upstreamMessage} | body: ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`,
    );

    if (status === 429) {
      gatewayThrottledUntil = computeThrottledUntil(body);
      const stale = this.serveStale<T>(cacheKey, method, url);
      if (stale) return stale;
    }

    throw new HttpException(status, upstreamMessage);
  }

  public async get<T>(config: AxiosRequestConfig, user: User, cacheTtl?: number): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' }, cacheTtl);
  }

  public async post<T>(
    config: AxiosRequestConfig,
    user: User,
    coalesce = false,
    cacheTtl?: number,
    staleCacheOnly = false,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' }, cacheTtl, coalesce, staleCacheOnly);
  }

  public async patch<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  public async delete<T>(config: AxiosRequestConfig, user: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default ApiService;
