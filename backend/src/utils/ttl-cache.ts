/**
 * Minimal in-memory TTL cache for opt-in upstream GETs (reference data + persondata).
 * Goal: stop refresh storms from re-hitting the rate-limited WSO2 gateway for data that
 * barely changes. Lazy eviction on read; a hard size cap prevents unbounded growth from
 * many distinct keys (e.g. per-user persondata lookups).
 *
 * NOTE: per-process only. If the app is scaled to multiple instances, move this to Redis
 * (the session store is already Redis-capable) — but for cutting gateway traffic this is enough.
 */
/** Cache lifetimes (ms). Persondata is mildly dynamic → short; lookup lists are near-static → longer. */
export const CACHE_TTL = {
  PERSONDATA: 60_000, // 1 minute — long enough to absorb refresh storms, short enough to stay fresh
  REFERENCE: 10 * 60_000, // 10 minutes — companies / form-of-employments / document types
} as const;

type CacheEntry = { value: unknown; expiresAt: number };

const store = new Map<string, CacheEntry>();

const MAX_ENTRIES = 500;

export const ttlCache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value as T;
  },

  set(key: string, value: unknown, ttlMs: number): void {
    if (store.size >= MAX_ENTRIES && !store.has(key)) {
      // Map preserves insertion order — drop the oldest entry.
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
};
