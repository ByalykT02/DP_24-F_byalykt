/**
 * Names the "strategic caching layer" operation:
 * per-endpoint in-memory cache for WikiArt JSON responses —
 * 5-minute TTL (`WIKIART_CACHE_TTL_MS`), max 200 entries with oldest-first
 * eviction, 10s AbortController timeout per origin request.
 */
import {
  buildWikiArtUrl,
  clearWikiArtCache,
  fetchWikiArtApi,
  getWikiArtCacheSize,
  isWikiArtCacheFresh,
  WIKIART_CACHE_MAX_ENTRIES,
  WIKIART_CACHE_TTL_MS,
} from "~/server/actions/data_fetching/fetch-api";

describe("WikiArt per-endpoint cache constants", () => {
  it("caches each endpoint for 5 minutes with a 200-entry bound", () => {
    expect(WIKIART_CACHE_TTL_MS).toBe(5 * 60 * 1000);
    expect(WIKIART_CACHE_MAX_ENTRIES).toBe(200);
  });

  it("builds absolute WikiArt URLs with or without a leading slash", () => {
    expect(buildWikiArtUrl("/search/monet/1?json=2")).toBe(
      "https://www.wikiart.org/en/search/monet/1?json=2",
    );
    expect(buildWikiArtUrl("App/Painting/ImageJson/1")).toBe(
      "https://www.wikiart.org/en/App/Painting/ImageJson/1",
    );
  });

  it("treats entries younger than TTL as fresh and older ones as stale", () => {
    const now = 1_000_000;
    expect(isWikiArtCacheFresh(now - 1000, now)).toBe(true);
    expect(isWikiArtCacheFresh(now - WIKIART_CACHE_TTL_MS, now)).toBe(false);
    expect(isWikiArtCacheFresh(now - WIKIART_CACHE_TTL_MS - 1, now)).toBe(false);
  });
});

describe("fetchWikiArtApi caching behaviour", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    clearWikiArtCache();
    jest.useRealTimers();
  });

  afterEach(() => {
    global.fetch = realFetch;
    clearWikiArtCache();
    jest.restoreAllMocks();
  });

  it("serves the second request for the same endpoint from cache (1 origin fetch)", async () => {
    const payload = [{ contentId: 1 }];
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const first = await fetchWikiArtApi("/search/monet/1?json=2");
    const second = await fetchWikiArtApi("/search/monet/1?json=2");

    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getWikiArtCacheSize()).toBe(1);
  });

  it("refetches after the 5-minute TTL expires", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ v: 1 }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchWikiArtApi("/App/Painting/ImageJson/1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Travel past TTL.
    const realNow = Date.now;
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => realNow() + WIKIART_CACHE_TTL_MS + 1000);
    try {
      await fetchWikiArtApi("/App/Painting/ImageJson/1");
    } finally {
      nowSpy.mockRestore();
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest entry once the 200-entry bound is exceeded", async () => {
    const fetchMock = jest.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url }),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    for (let i = 0; i < WIKIART_CACHE_MAX_ENTRIES + 1; i++) {
      // eslint-disable-next-line no-await-in-loop
      await fetchWikiArtApi(`/endpoint-${i}`);
    }
    expect(getWikiArtCacheSize()).toBe(WIKIART_CACHE_MAX_ENTRIES);
  });

  it("throws HTTP error status instead of caching failures", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchWikiArtApi("/search/x/1?json=2")).rejects.toThrow(
      "HTTP error! status: 503",
    );
    expect(getWikiArtCacheSize()).toBe(0);
  });

  it("maps AbortError to a request-timeout error naming the endpoint", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchMock = jest.fn().mockRejectedValue(abortError);
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchWikiArtApi("/search/slow/1?json=2")).rejects.toThrow(
      "Request timeout for /search/slow/1?json=2",
    );
  });
});
