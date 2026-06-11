import { HttpException } from '@/exceptions/HttpException';
import { apiURL } from '@/utils/util';
import { logger } from '@/utils/logger';
import { ttlCache } from '@/utils/ttl-cache';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
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

class ApiService {
  static get<T>(arg0: { url: string; }) {
    throw new Error('Method not implemented.');
  }
  // Coalesces concurrent identical (cacheable) requests so a cache-cold page load doesn't fire
  // the same upstream call twice (e.g. persondata requested by getEmployeeByLoginName and the
  // avatar lookup at the same instant — both miss the value cache before either populates it).
  private static readonly inflight = new Map<string, Promise<ApiResponse<unknown>>>();

  private async request<T>(config: AxiosRequestConfig, cacheTtl?: number, coalesce = false): Promise<ApiResponse<T>> {
    const url = apiURL(config.url ? config.url : '');

    // Dedupe key: cacheable GETs key on params (so persondata shared by getEmployeeByLoginName and the
    // avatar lookup hits one cached value); coalesce-only requests (e.g. the search POST) key on the body
    // so identical concurrent calls — like StrictMode's double-fire — collapse to a single upstream call.
    let dedupeKey: string | null = null;
    if (cacheTtl) {
      dedupeKey = `${config.method}:${url}:${JSON.stringify(config.params ?? {})}`;
    } else if (coalesce) {
      dedupeKey = `${config.method}:${url}:${JSON.stringify(config.data ?? {})}`;
    }

    if (dedupeKey) {
      if (cacheTtl) {
        const cached = ttlCache.get<ApiResponse<T>>(dedupeKey);
        if (cached) return cached;
      }
      const pending = ApiService.inflight.get(dedupeKey) as Promise<ApiResponse<T>> | undefined;
      if (pending) return pending;
    }

    // Only pass a cache key to performRequest when we actually want to store the result (cacheTtl set).
    const exec = this.performRequest<T>(config, url, cacheTtl ? dedupeKey : null, cacheTtl);

    if (dedupeKey) {
      ApiService.inflight.set(dedupeKey, exec);
      // Use a settle handler (NOT .finally) so a rejected exec doesn't spawn its own unhandled rejection
      // on this cleanup branch. The original exec is still returned, so the caller handles the error.
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
    } catch (error: unknown | AxiosError) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const body = error.response.data;
        const upstreamMessage =
          (body as { message?: string; title?: string } | undefined)?.message ??
          (body as { title?: string } | undefined)?.title ??
          error.message;
        logger.error(
          `Upstream ${preparedConfig.method} ${preparedConfig.url} -> ${status}: ${upstreamMessage} | body: ${
            typeof body === 'string' ? body : JSON.stringify(body)
          }`,
        );
        // NOTE: 401/403 here usually means the app user is not subscribed to this API/version in WSO2.
        throw new HttpException(status, upstreamMessage);
      }
      // No response from upstream (network error, timeout, DNS, etc.)
      logger.error(`Upstream ${preparedConfig.method} ${preparedConfig.url} -> no response: ${String(error)}`);
      throw new HttpException(502, 'No response from gateway');
    }
  }

  public async get<T>(config: AxiosRequestConfig, user: User, cacheTtl?: number): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' }, cacheTtl);
  }

  public async post<T>(config: AxiosRequestConfig, user: User, coalesce = false): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' }, undefined, coalesce);
  }

  public async patch<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  public async delete<T>(config: AxiosRequestConfig, user: User): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default ApiService;
