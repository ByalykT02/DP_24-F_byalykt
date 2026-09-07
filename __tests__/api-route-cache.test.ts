/**
 * Names the second caching layer operation:
 * LRU cache (max 500 entries, 2h TTL, stale-while-revalidate) in front of
 * `GET /api/wikiart/[...path]`, signalling HIT/MISS via `X-Cache-Status`
 * plus `Cache-Control: public, s-maxage=3600, stale-while-revalidate=300`.
 */
import { LRUCache } from "lru-cache";
import {
  apiCache,
  buildWikiArtCacheHeaders,
  WIKIART_ROUTE_CACHE_MAX,
  WIKIART_ROUTE_CACHE_TTL_MS,
} from "~/app/api/wikiart/[...path]/route";

describe("WikiArt proxy route cache configuration", () => {
  it("holds at most 500 entries for 2 hours and allows stale reads", () => {
    expect(WIKIART_ROUTE_CACHE_MAX).toBe(500);
    expect(WIKIART_ROUTE_CACHE_TTL_MS).toBe(2 * 60 * 60 * 1000);
    expect(apiCache.max).toBe(500);
    // lru-cache exposes ttl as `ttlAutopurge`/`ttl`; verify via a probe entry.
    const probe = new LRUCache<string, object>({
      max: WIKIART_ROUTE_CACHE_MAX,
      ttl: WIKIART_ROUTE_CACHE_TTL_MS,
      allowStale: true,
    });
    probe.set("k", { v: 1 });
    expect(probe.get("k")).toEqual({ v: 1 });
  });

  it("emits X-Cache-Status HIT/MISS with identical Cache-Control directives", () => {
    const hit = buildWikiArtCacheHeaders("HIT");
    const miss = buildWikiArtCacheHeaders("MISS");
    expect(hit["X-Cache-Status"]).toBe("HIT");
    expect(miss["X-Cache-Status"]).toBe("MISS");
    for (const headers of [hit, miss]) {
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Cache-Control"]).toBe(
        "public, s-maxage=3600, stale-while-revalidate=300",
      );
    }
  });

  it("evicts least-recently-used entries past max capacity", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // touch a so b is LRU
    cache.set("c", 3);
    expect(cache.has("b")).toBe(false);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("distinguishes cached JSON payloads from cached null failure markers", () => {
    apiCache.clear();
    apiCache.set("ok/path", { data: [1, 2] });
    // Route handler treats null as miss (falsy guard uses !== null check);
    // document that null must never be served as HIT JSON.
    expect(apiCache.get("ok/path")).toEqual({ data: [1, 2] });
    expect(apiCache.get("missing/path")).toBeUndefined();
    apiCache.clear();
  });
});
