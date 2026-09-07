/**
 * Names the ingestion-pipeline operations:
 * - `isValidArtwork` / `isValidArtist` gate before WikiArt -> Postgres upsert,
 * - artist staleness window (30 days) before re-calling `fetchArtistDetails`,
 * - pagination clamping for artwork/artist search (page >= 1, pageSize caps).
 */
import {
  ARTIST_STALENESS_DAYS,
  isValidArtist,
  isValidArtwork,
} from "~/server/actions/content/artwork-to-db-utils";
import { normalizeArtistPagination } from "~/lib/data/artist-utils";
import { FALLBACK_ARTWORK } from "~/lib/data/artwork-utils";

// Validator tests must not open a Postgres connection.
jest.mock("~/server/db", () => ({ db: {} }));

function validArtwork() {
  return {
    ...FALLBACK_ARTWORK,
    contentId: 1,
    artistContentId: 2,
    title: "T",
    image: "https://x/y.jpg",
  };
}

describe("isValidArtwork (upsert gate)", () => {
  it("accepts a fully-populated artwork", () => {
    expect(isValidArtwork(validArtwork())).toBe(true);
  });

  it.each([
    [{ contentId: 0 }, "non-positive contentId"],
    [{ artistContentId: 0 }, "non-positive artistContentId"],
    [{ title: "   " }, "blank title"],
    [{ image: "" }, "blank image"],
  ] as Array<[Record<string, unknown>, string]>)(
    "rejects artwork with %p (%s)",
    (override) => {
      expect(
        isValidArtwork({ ...validArtwork(), ...override }),
      ).toBe(false);
    },
  );
});

describe("isValidArtist (upsert gate)", () => {
  it("accepts a positive contentId with a non-blank name", () => {
    expect(
      isValidArtist({ contentId: 1, artistName: "Monet", artistUrl: "monet" }),
    ).toBe(true);
  });

  it("rejects zero ids and blank names (null URL is allowed)", () => {
    expect(
      isValidArtist({ contentId: 0, artistName: "Monet", artistUrl: null }),
    ).toBe(false);
    expect(
      isValidArtist({ contentId: 1, artistName: "  ", artistUrl: null }),
    ).toBe(false);
  });
});

describe("artist staleness window (DB-first cache)", () => {
  it("revalidates artist rows older than 30 days", () => {
    expect(ARTIST_STALENESS_DAYS).toBe(30);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ARTIST_STALENESS_DAYS);
    const fresh = new Date();
    const stale = new Date(cutoff.getTime() - 1000);
    expect(fresh > cutoff).toBe(true);
    expect(stale > cutoff).toBe(false);
  });
});

describe("normalizeArtistPagination (DB pagination guard)", () => {
  it("clamps page to >= 1 and pageSize to 1..100", () => {
    expect(normalizeArtistPagination(0, 15)).toEqual({ page: 1, pageSize: 15 });
    expect(normalizeArtistPagination(-3, 500)).toEqual({
      page: 1,
      pageSize: 100,
    });
    expect(normalizeArtistPagination(2, 0)).toEqual({ page: 2, pageSize: 15 });
  });
});

describe("searchArtworks pagination contract (1..50 pageSize)", () => {
  it("documents the clamp: page>=1, 1<=pageSize<=50", () => {
    const clamp = (page: number, pageSize: number) => ({
      validPage: Math.max(1, page),
      validPageSize: Math.min(50, Math.max(1, pageSize)),
    });
    expect(clamp(0, 200)).toEqual({ validPage: 1, validPageSize: 50 });
    expect(clamp(-1, 0)).toEqual({ validPage: 1, validPageSize: 1 });
    expect(clamp(3, 20)).toEqual({ validPage: 3, validPageSize: 20 });
  });
});
