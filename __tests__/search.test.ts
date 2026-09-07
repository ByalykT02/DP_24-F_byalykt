/**
 * Names the "search algorithm" operation:
 * WikiArt `GET /search/<term>/1?json=2` + in-memory dedup by artistContentId
 * (slug from `/images/<slug>/`) + `!Large.jpg` strip + slice to 5 artworks / 5 artists.
 */
import {
  processSearchResults,
  SEARCH_ARTIST_LIMIT,
  SEARCH_ARTWORK_LIMIT,
  SEARCH_MIN_QUERY_LENGTH,
} from "~/server/actions/user_features/search-utils";
import { search } from "~/server/actions/user_features/search";
import * as fetchApi from "~/server/actions/data_fetching/fetch-api";
import type { WikiArtSearchResult } from "~/lib/types/artwork";

function makeRow(overrides: Partial<WikiArtSearchResult> = {}): WikiArtSearchResult {
  return {
    title: "Starry Night",
    contentId: 1,
    artistContentId: 10,
    artistName: "Vincent van Gogh",
    completitionYear: 1889,
    yearAsString: "1889",
    width: 100,
    image:
      "https://uploads1.wikiart.org/images/vincent-van-gogh/starry-night.jpg!Large.jpg",
    height: 80,
    ...overrides,
  };
}

describe("processSearchResults (WikiArt /search normalization)", () => {
  it("strips the !Large.jpg size suffix from artwork images", () => {
    const out = processSearchResults([makeRow()]);
    expect(out.artworks[0]?.image).toBe(
      "https://uploads1.wikiart.org/images/vincent-van-gogh/starry-night.jpg",
    );
  });

  it("derives the artist slug from the /images/<slug>/ URL segment", () => {
    const out = processSearchResults([makeRow()]);
    expect(out.artists[0]).toMatchObject({
      contentId: 10,
      artistName: "Vincent van Gogh",
      url: "vincent-van-gogh",
      type: "artist",
    });
  });

  it("de-duplicates artists by artistContentId, keeping the first occurrence", () => {
    const out = processSearchResults([
      makeRow({ contentId: 1, artistContentId: 10, artistName: "Gogh" }),
      makeRow({ contentId: 2, artistContentId: 10, artistName: "Gogh" }),
      makeRow({
        contentId: 3,
        artistContentId: 11,
        artistName: "Monet",
        image: "https://uploads1.wikiart.org/images/claude-monet/water.jpg!Large.jpg",
      }),
    ]);
    expect(out.artworks).toHaveLength(3);
    expect(out.artists).toHaveLength(2);
    expect(out.artists.map((a) => a.contentId).sort()).toEqual([10, 11]);
  });

  it("leaves artist url undefined when the image has no /images/<slug>/ segment", () => {
    const out = processSearchResults([
      makeRow({ image: "https://example.com/no-slug.jpg" }),
    ]);
    expect(out.artists[0]?.url).toBeUndefined();
  });
});

describe("search() query gating and result limits", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(["", " ", "a", " x "])(
    "does not call WikiArt for queries shorter than %p chars (min=%p)",
    async (query) => {
      const spy = jest
        .spyOn(fetchApi, "fetchWikiArtApi")
        .mockResolvedValue([]);
      expect(SEARCH_MIN_QUERY_LENGTH).toBe(2);
      const out = await search(query);
      expect(out).toEqual({ artworks: [], artists: [] });
      expect(spy).not.toHaveBeenCalled();
    },
  );

  it(`trims the query and caps results at ${SEARCH_ARTWORK_LIMIT} artworks / ${SEARCH_ARTIST_LIMIT} artists`, async () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      makeRow({
        contentId: i + 1,
        title: `Work ${i + 1}`,
        artistContentId: 100 + i,
        artistName: `Artist ${i + 1}`,
        image: `https://uploads1.wikiart.org/images/artist-${i + 1}/work.jpg!Large.jpg`,
      }),
    );
    const spy = jest
      .spyOn(fetchApi, "fetchWikiArtApi")
      .mockResolvedValue(rows);
    const out = await search("  monet  ");
    expect(spy).toHaveBeenCalledWith("/search/monet/1?json=2");
    expect(out.artworks).toHaveLength(SEARCH_ARTWORK_LIMIT);
    expect(out.artists).toHaveLength(SEARCH_ARTIST_LIMIT);
  });

  it("returns empty results instead of throwing when WikiArt fails", async () => {
    jest
      .spyOn(fetchApi, "fetchWikiArtApi")
      .mockRejectedValue(new Error("network down"));
    await expect(search("monet")).resolves.toEqual({
      artworks: [],
      artists: [],
    });
  });
});
