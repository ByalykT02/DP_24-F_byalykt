import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

const WIKIART_BASE_URL = "https://www.wikiart.org/en";

const apiCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60 * 2,
  allowStale: true,
});

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const apiPath = params.path.join("/");
    const cacheKey = apiPath;

    // 1. Check the cache first
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse) {
      return new Response(JSON.stringify(cachedResponse), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
          "X-Cache-Status": "HIT",
        },
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
      apiCache.set(cacheKey, null, 1000 * 60 * 5);
      return new Response(
        JSON.stringify({ error: `WikiArt API error: ${response.status}` }),
        { status: response.status },
      );
    }

    const data = await response.json();
    apiCache.set(cacheKey, data);
    
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        "X-Cache-Status": "MISS",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
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
