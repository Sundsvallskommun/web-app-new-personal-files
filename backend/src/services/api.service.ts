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

// WSO2 enforces a single shared quota across the whole employee-API subscription, so a throttle hit on
// one route means every route is throttled. We track one process-wide "open until" timestamp: while it's
// in the future, the circuit is open and we don't call upstream at all (serving stale cache when we can).
// This stops the app from hammering an already-exhausted quota — repeated hits can extend the lockout.
let gatewayThrottledUntil = 0;

const THROTTLE_FALLBACK_MS = 60_000; // if we can't parse nextAccessTime, back off ~1 min (observed reset cadence)
const THROTTLE_MAX_MS = 5 * 60_000; // never lock ourselves out longer than this from a bad/absurd timestamp

const isGatewayThrottled = (): boolean => Date.now() < gatewayThrottledUntil;

// WSO2's throttle body carries `nextAccessTime` like "2026-Jun-11 09:16:00+0000 UTC". Parse it defensively
// (drop the "UTC" label and trim so the engine parses the offset); fall back to a fixed cooldown, and clamp
// so a misparse can never wedge the circuit open for long. The replace uses no quantifiers (a plain literal)
// so it can't backtrack.
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
  // Coalesces concurrent identical (cacheable) requests so a cache-cold page load doesn't fire
  // the same upstream call twice (e.g. persondata requested by getEmployeeByLoginName and the
  // avatar lookup at the same instant — both miss the value cache before either populates it).
  private static readonly inflight = new Map<string, Promise<ApiResponse<unknown>>>();

  private async request<T>(
    config: AxiosRequestConfig,
    cacheTtl?: number,
    coalesce = false,
    staleCacheOnly = false,
  ): Promise<ApiResponse<T>> {
    const url = apiURL(config.url ? config.url : '');

    // Dedupe key covers both params and body so GETs (keyed by params, e.g. persondata shared by
    // getEmployeeByLoginName and the avatar lookup) and body-bearing POSTs (keyed by data, e.g. the
    // document search) each get a unique key — identical concurrent calls collapse to one upstream call.
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
    // Circuit open: a recent 429 told us the shared quota is exhausted. Bail before fetching a token or
    // calling upstream — serve stale cache if we have it, otherwise fail fast so we stop adding to the
    // quota pressure that caused this.
    if (isGatewayThrottled()) {
      if (cacheKey) {
        const stale = ttlCache.getStale<ApiResponse<T>>(cacheKey);
        if (stale) {
          logger.warn(`Gateway throttled — serving stale cache for ${config.method} ${url}`);
          return stale;
        }
      }
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
        // 429 = WSO2 quota throttle. Trip the breaker so concurrent/follow-up calls stop hitting the gateway,
        // and serve stale cache (if any) instead of erroring this caller.
        if (status === 429) {
          gatewayThrottledUntil = computeThrottledUntil(body);
          if (cacheKey) {
            const stale = ttlCache.getStale<ApiResponse<T>>(cacheKey);
            if (stale) {
              logger.warn(`Gateway throttled — serving stale cache for ${preparedConfig.method} ${preparedConfig.url}`);
              return stale;
            }
          }
        }
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
