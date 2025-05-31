const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function fetchWikiArtApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const cacheKey = endpoint;
    const now = Date.now();
    const cachedItem = cache.get(cacheKey);

    if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
      return cachedItem.data as T;
    }

    const url = new URL(`https://www.wikiart.org/en${endpoint}`);

    const headers: HeadersInit = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
    };

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    cache.set(cacheKey, {
      data,
      timestamp: now,
    });

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
