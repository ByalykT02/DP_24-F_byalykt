import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";
import { logger } from "~/utils/logger";

export const WIKIART_BASE_URL = "https://www.wikiart.org/en";
/** LRU holds at most 500 WikiArt JSON responses for 2h (stale served while revalidating). */
export const WIKIART_ROUTE_CACHE_MAX = 500;
export const WIKIART_ROUTE_CACHE_TTL_MS = 1000 * 60 * 60 * 2;
/** Negative caching window for upstream error responses. */
export const WIKIART_ROUTE_ERROR_TTL_MS = 1000 * 60 * 5;
export const WIKIART_ROUTE_REVALIDATE_SECONDS = 3600;

// lru-cache v11 constrains values to `V extends {}` and takes per-entry TTL
// via a `{ ttl }` options object, so `any` is required to cache arbitrary
// JSON payloads plus null failure markers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCache = new LRUCache<string, any>({
  max: WIKIART_ROUTE_CACHE_MAX,
  ttl: WIKIART_ROUTE_CACHE_TTL_MS,
  allowStale: true,
});

export const revalidate = 3600;

export function buildWikiArtCacheHeaders(
  cacheStatus: "HIT" | "MISS",
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
    "X-Cache-Status": cacheStatus,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const apiPath = params.path.join("/");
    const cacheKey = apiPath;

    // 1. Check the cache first
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse !== undefined && cachedResponse !== null) {
      return new Response(JSON.stringify(cachedResponse), {
        headers: buildWikiArtCacheHeaders("HIT"),
      });
    }

    // 2. Fetch from origin with timeout

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${WIKIART_BASE_URL}/${apiPath}`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      apiCache.set(cacheKey, null, { ttl: WIKIART_ROUTE_ERROR_TTL_MS });
      return new Response(
        JSON.stringify({ error: `WikiArt API error: ${response.status}` }),
        { status: response.status },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    apiCache.set(cacheKey, data);

    return new Response(JSON.stringify(data), {
      headers: buildWikiArtCacheHeaders("MISS"),
    });
  } catch (error) {
    logger.error("API route error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: "Failed to fetch from WikiArt API" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
