/**
 * Names the home/discovery operations:
 * - Fisher-Yates `shuffleArray` for artwork variety,
 * - `!Large.jpg` strip via `processHomeArtwork`,
 * - `MAX_ARTWORKS = 9` cap on home/featured/artist feeds,
 * - `!Portrait.jpg` strip via `processArtist`.
 */
import {
  FALLBACK_DATA,
  MAX_ARTWORKS,
  processHomeArtwork,
  shuffleArray,
} from "~/server/actions/data_fetching/fetch-artworks-home";
import { processArtist } from "~/server/actions/data_fetching/fetch-artists";
import type { Artwork } from "~/lib/types/artwork";

// Feed tests cover pure helpers only; do not open a Postgres connection.
jest.mock("~/server/db", () => ({ db: {} }));

function makeArtwork(id: number): Artwork {
  return {
    title: `Work ${id}`,
    contentId: id,
    artistContentId: 1,
    artistName: "A",
    completitionYear: 1900,
    yearAsString: "1900",
    width: 10,
    height: 10,
    image: `https://x/${id}.jpg!Large.jpg`,
  };
}

describe("home feed constants", () => {
  it("caps home/featured feeds at 9 artworks", () => {
    expect(MAX_ARTWORKS).toBe(9);
  });

  it("ships a Mucha fallback artist + artwork", () => {
    expect(FALLBACK_DATA.artist.artistName).toMatch(/Mucha/);
    expect(FALLBACK_DATA.artworks[0]?.contentId).toBe(227658);
  });
});

describe("shuffleArray (Fisher-Yates)", () => {
  it("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffleArray(input);
    expect(out).not.toBe(input);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input and handles empty input", () => {
    const input = [makeArtwork(1), makeArtwork(2)];
    const snapshot = [...input];
    shuffleArray(input);
    expect(input).toEqual(snapshot);
    expect(shuffleArray([])).toEqual([]);
  });

  it("actually permutes over many runs (statistical sanity)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(shuffleArray(input).join(","));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("processHomeArtwork / processArtist (feed image normalization)", () => {
  it("strips !Large.jpg from home artworks", () => {
    expect(processHomeArtwork(makeArtwork(1)).image).toBe("https://x/1.jpg");
  });

  it("strips !Portrait.jpg from artist portraits", () => {
    expect(
      processArtist({
        contentId: 1,
        artistName: "A",
        url: "a",
        lastNameFirst: "A",
        birthDayAsString: "",
        deathDayAsString: "",
        image: "https://uploads6.wikiart.org/images/a.jpg!Portrait.jpg",
        wikipediaUrl: "",
      }).image,
    ).toBe("https://uploads6.wikiart.org/images/a.jpg");
  });
});
