/**
 * Names the "search algorithm" operation precisely:
 * weighted Jaccard similarity over tags/dictionaries + exact-match bonuses
 * (style 2.5, genre 2.0, period/technique 1.5, same-artist 1.5) + linear
 * 100-year time decay, with a diversityFactor penalty and per-artist cap.
 */
import {
  calculateDictionarySimilarity,
  calculateSimilarityScore,
  calculateTagSimilarity,
  calculateTimeDistance,
  processArtwork,
  RECOMMENDATION_WEIGHTS,
  toDictionaryIds,
} from "~/server/actions/user_features/recommendations";

// Ranking is pure math; do not open a Postgres connection in unit tests.
jest.mock("~/server/db", () => ({ db: {} }));

describe("recommendation weights (documented ranking operation)", () => {
  it("uses the documented weight vector", () => {
    expect(RECOMMENDATION_WEIGHTS).toEqual({
      sameArtist: 1.5,
      style: 2.5,
      genre: 2.0,
      period: 1.5,
      technique: 1.5,
      tags: 3.0,
      dictionaries: 2.5,
      time: 1.0,
    });
  });
});

describe("calculateTimeDistance (linear 100-year decay)", () => {
  it("scores 1.0 for the same year and 0.0 beyond 100 years", () => {
    expect(calculateTimeDistance(1900, 1900)).toBe(1);
    expect(calculateTimeDistance(1900, 1950)).toBeCloseTo(0.5);
    expect(calculateTimeDistance(1900, 2000)).toBe(0);
    expect(calculateTimeDistance(1900, 2100)).toBe(0);
  });

  it("scores 0 when either year is missing", () => {
    expect(calculateTimeDistance(undefined, 1900)).toBe(0);
    expect(calculateTimeDistance(1900, null)).toBe(0);
  });
});

describe("calculateTagSimilarity (Jaccard over comma-separated tags)", () => {
  it("computes intersection-over-union", () => {
    expect(calculateTagSimilarity("a, b, c", "b, c, d")).toBeCloseTo(2 / 4);
    expect(calculateTagSimilarity("a", "a")).toBe(1);
    expect(calculateTagSimilarity("a", "b")).toBe(0);
  });

  it("ignores whitespace/empty segments and nulls", () => {
    expect(calculateTagSimilarity(" a , , b ", "a,b")).toBe(1);
    expect(calculateTagSimilarity(null, "a")).toBe(0);
    expect(calculateTagSimilarity("", "")).toBe(0);
  });
});

describe("calculateDictionarySimilarity (Jaccard over id sets)", () => {
  it("computes intersection-over-union", () => {
    expect(calculateDictionarySimilarity([1, 2], [2, 3])).toBeCloseTo(1 / 3);
    expect(calculateDictionarySimilarity([1], [1])).toBe(1);
  });

  it("scores 0 for missing inputs and empty union", () => {
    expect(calculateDictionarySimilarity(null, [1])).toBe(0);
    expect(calculateDictionarySimilarity([], [])).toBe(0);
  });
});

describe("calculateSimilarityScore (weighted ranking)", () => {
  const reference = {
    style: "Symbolism",
    genre: "religious painting",
    period: "19th",
    technique: "oil",
    tags: "sky, priests",
    dictionaries: [1, 2],
    completitionYear: 1900,
  };

  it("ranks an identical-style/tag/time match above a mismatch", () => {
    const good = {
      artist: { contentId: 7 },
      style: "Symbolism",
      genre: "religious painting",
      period: "19th",
      technique: "oil",
      tags: "sky, priests",
      dictionaries: [1, 2],
      completitionYear: 1900,
    };
    const bad = {
      artist: { contentId: 8 },
      style: "Cubism",
      genre: "portrait",
      period: "20th",
      technique: "watercolor",
      tags: "dog",
      dictionaries: [9],
      completitionYear: 2000,
    };
    expect(calculateSimilarityScore(good, reference, 7, 0)).toBeGreaterThan(
      calculateSimilarityScore(bad, reference, 7, 0),
    );
  });

  it("applies the same-artist bonus and the diversityFactor penalty", () => {
    const sameArtist = {
      artist: { contentId: 7 },
      style: "X",
      genre: "Y",
      period: "Z",
      technique: "W",
      tags: "nope",
      dictionaries: [99],
      completitionYear: 1800,
    };
    const noBonus = { ...sameArtist, artist: { contentId: 8 } };
    const withBonus = calculateSimilarityScore(sameArtist, reference, 7, 0);
    const withoutBonus = calculateSimilarityScore(noBonus, reference, 7, 0);
    expect(withBonus - withoutBonus).toBeCloseTo(
      RECOMMENDATION_WEIGHTS.sameArtist,
    );

    const penalized = calculateSimilarityScore(sameArtist, reference, 7, 0.3);
    expect(penalized).toBeCloseTo(withBonus * (1 - 0.3));
  });
});

describe("processArtwork (recommendation image normalization)", () => {
  it("strips !Large.jpg from recommendation images", () => {
    expect(
      processArtwork({ image: "https://x/y.jpg!Large.jpg" }).image,
    ).toBe("https://x/y.jpg");
  });
});

describe("toDictionaryIds (json-column coercion)", () => {
  it("passes numeric arrays through and drops non-numeric entries", () => {
    expect(toDictionaryIds([1, 2])).toEqual([1, 2]);
    expect(toDictionaryIds([1, "x", 2])).toEqual([1, 2]);
  });

  it("returns null for non-array json values", () => {
    expect(toDictionaryIds(null)).toBeNull();
    expect(toDictionaryIds("1,2")).toBeNull();
  });
});
