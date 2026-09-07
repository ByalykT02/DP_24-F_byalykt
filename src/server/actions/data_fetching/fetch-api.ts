interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
export const WIKIART_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes per-endpoint cache
/** Backwards-compatible alias. */
export const CACHE_TTL = WIKIART_CACHE_TTL_MS;
/** Upper bound so the in-memory Map cannot grow without limit. */
export const WIKIART_CACHE_MAX_ENTRIES = 200;

export function clearWikiArtCache(): void {
  cache.clear();
}

export function getWikiArtCacheSize(): number {
  return cache.size;
}

export function isWikiArtCacheFresh(timestamp: number, now = Date.now()): boolean {
  return now - timestamp < WIKIART_CACHE_TTL_MS;
}

function setWikiArtCache(key: string, data: unknown, now: number): void {
  // Evict the oldest entry (Map preserves insertion order) when full.
  if (!cache.has(key) && cache.size >= WIKIART_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { data, timestamp: now });
}

export function buildWikiArtUrl(endpoint: string): string {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return new URL(`https://www.wikiart.org/en${normalized}`).toString();
}

export async function fetchWikiArtApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const cacheKey = endpoint;
    const now = Date.now();
    const cachedItem = cache.get(cacheKey);

    if (cachedItem && isWikiArtCacheFresh(cachedItem.timestamp, now)) {
      return cachedItem.data as T;
    }

    const url = buildWikiArtUrl(endpoint);

    const headers: HeadersInit = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
    };

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as T;

    setWikiArtCache(cacheKey, data, now);

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
