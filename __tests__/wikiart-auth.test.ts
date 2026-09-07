/**
 * Names the WikiArt session operation:
 * `GET /Api/2/login?accessCode=&secretCode=` -> 23h in-memory sessionKey,
 * reused until expiry. Accepts both *_KEY (Vercel pull) and *_CODE (legacy)
 * credential names.
 */
import {
  buildWikiArtLoginUrl,
  clearWikiArtAuthSession,
  getWikiArtAuthSession,
  isWikiArtSessionFresh,
  WIKIART_SESSION_TTL_MS,
} from "~/lib/wikiart-auth";

describe("WikiArt session constants and helpers", () => {
  it("caches the sessionKey for 23h (1h before the 24h WikiArt limit)", () => {
    expect(WIKIART_SESSION_TTL_MS).toBe(23 * 60 * 60 * 1000);
  });

  it("builds an encoded login URL", () => {
    expect(buildWikiArtLoginUrl("a c", "s&s")).toBe(
      "https://www.wikiart.org/en/Api/2/login?accessCode=a%20c&secretCode=s%26s",
    );
  });

  it("reports session freshness against expiry", () => {
    const now = 1_000_000;
    expect(
      isWikiArtSessionFresh({ sessionKey: "k", expiresAt: now + 1 }, now),
    ).toBe(true);
    expect(
      isWikiArtSessionFresh({ sessionKey: "k", expiresAt: now }, now),
    ).toBe(false);
    expect(isWikiArtSessionFresh(null, now)).toBe(false);
  });
});

describe("getWikiArtAuthSession caching", () => {
  const realFetch = global.fetch;
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    clearWikiArtAuthSession();
    process.env.WIKIART_ACCESS_KEY = "test-access";
    process.env.WIKIART_SECRET_KEY = "test-secret";
    delete process.env.WIKIART_ACCESS_CODE;
    delete process.env.WIKIART_SECRET_CODE;
  });

  afterEach(() => {
    global.fetch = realFetch;
    process.env = { ...OLD_ENV };
    clearWikiArtAuthSession();
    jest.restoreAllMocks();
  });

  it("calls /Api/2/login once and reuses the sessionKey", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionKey: "sess-1" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getWikiArtAuthSession()).resolves.toBe("sess-1");
    await expect(getWikiArtAuthSession()).resolves.toBe("sess-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/Api/2/login");
  });

  it("throws a named error when credentials are missing", async () => {
    delete process.env.WIKIART_ACCESS_KEY;
    delete process.env.WIKIART_SECRET_KEY;
    await expect(getWikiArtAuthSession()).rejects.toThrow(
      "Missing WikiArt credentials",
    );
  });

  it("throws when the login response has no sessionKey", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(getWikiArtAuthSession()).rejects.toThrow(
      "missing sessionKey",
    );
  });

  it("accepts WikiArt's capital-S `SessionKey` field (live API shape)", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          SessionKey: "live-shape-key",
          MaxRequestsPerHour: 100,
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(getWikiArtAuthSession()).resolves.toBe("live-shape-key");
  });
});
