/**
 * Names the ingestion/normalization operation:
 * WikiArt `Painting/ImageJson` payload -> DB-ready ArtworkDetailed —
 * strips image size suffixes, Wiki `[markup]`, coerces numbers, and falls
 * back to Mucha "Holy Mount Athos" (contentId 227658) on invalid input.
 */
import {
  cleanWikiArtDescription,
  cleanWikiArtImageUrl,
  coerceArtworkDimension,
  FALLBACK_ARTWORK,
  processArtworkData,
  WIKIART_IMAGE_SIZE_SUFFIX_PATTERN,
} from "~/server/actions/data_fetching/fetch-artwork";

// Pure normalization tests must not open a Postgres connection.
jest.mock("~/server/db", () => ({ db: {} }));

describe("WikiArt image URL cleaning", () => {
  it.each([
    ["a.jpg!Large.jpg", "a.jpg"],
    ["a.jpg!Portrait.jpg", "a.jpg"],
    ["a.jpg!Square.jpg", "a.jpg"],
    ["a.jpg!PinterestSmall.jpg", "a.jpg"],
  ])("strips %s suffix", (input, expected) => {
    // Reset global regex state between runs.
    WIKIART_IMAGE_SIZE_SUFFIX_PATTERN.lastIndex = 0;
    expect(cleanWikiArtImageUrl(input)).toBe(expected);
  });

  it("leaves already-clean URLs untouched", () => {
    expect(
      cleanWikiArtImageUrl("https://uploads7.wikiart.org/images/x/y.jpg"),
    ).toBe("https://uploads7.wikiart.org/images/x/y.jpg");
  });
});

describe("WikiArt description cleaning", () => {
  it("removes [bracket markup] and trims whitespace", () => {
    expect(
      cleanWikiArtDescription("  A saint [1] with sky [ref]  "),
    ).toBe("A saint  with sky");
  });
});

describe("coerceArtworkDimension (decimal-column coercion)", () => {
  it("accepts numeric strings and numbers, rejecting blanks/non-numeric", () => {
    expect(coerceArtworkDimension("1983")).toBe("1983");
    expect(coerceArtworkDimension(1983)).toBe("1983");
    expect(coerceArtworkDimension(null)).toBeNull();
    expect(coerceArtworkDimension("")).toBeNull();
    expect(coerceArtworkDimension("not-a-number")).toBeNull();
  });
});

describe("processArtworkData (ImageJson -> ArtworkDetailed)", () => {
  it("documents the fallback artwork identity (Mucha, Holy Mount Athos)", () => {
    expect(FALLBACK_ARTWORK.contentId).toBe(227658);
    expect(FALLBACK_ARTWORK.title).toBe("Holy Mount Athos");
    expect(FALLBACK_ARTWORK.artistContentId).toBe(227598);
  });

  it("returns the fallback for null/undefined/non-object input", () => {
    expect(processArtworkData(null as unknown as never)).toBe(FALLBACK_ARTWORK);
    expect(processArtworkData(undefined as unknown as never)).toBe(
      FALLBACK_ARTWORK,
    );
  });

  it("normalizes a full payload: image suffix, markup, numeric coercion", () => {
    const out = processArtworkData({
      contentId: 1,
      artistContentId: 2,
      artistName: "Test Artist",
      artistUrl: "test-artist",
      title: "Test",
      image: "https://x/y.jpg!Large.jpg",
      description: "Hello [world]",
      width: "1983",
      height: "1689",
      completitionYear: "1926" as unknown as number,
      yearOfTrade: "2000" as unknown as number,
      dictionaries: [1, 2],
    });
    expect(out.image).toBe("https://x/y.jpg");
    expect(out.description).toBe("Hello");
    // Dimensions are stored as strings (DB `decimal` columns read back as strings).
    expect(out.width).toBe("1983");
    expect(out.height).toBe("1689");
    expect(out.completitionYear).toBe(1926);
    expect(out.yearOfTrade).toBe(2000);
  });

  it("fills missing required fields from the fallback instead of throwing", () => {
    const out = processArtworkData({});
    expect(out.contentId).toBe(FALLBACK_ARTWORK.contentId);
    expect(out.title).toBe(FALLBACK_ARTWORK.title);
    expect(out.image).toBe(FALLBACK_ARTWORK.image);
  });

  it("nulls non-array dictionaries", () => {
    const out = processArtworkData({
      contentId: 5,
      artistContentId: 6,
      artistName: "A",
      artistUrl: "a",
      title: "T",
      image: "i",
      dictionaries: "nope" as unknown as number[],
    });
    expect(out.dictionaries).toBeNull();
  });

  it("measures normalization throughput (median over 200 runs, documents SSR cost)", () => {
    const payload = {
      contentId: 1,
      artistContentId: 2,
      artistName: "A",
      artistUrl: "a",
      title: "T",
      image: "https://x/y.jpg!Large.jpg",
      description: "d [x]",
    };
    const samples: number[] = [];
    for (let i = 0; i < 200; i++) {
      const start = performance.now();
      processArtworkData(payload);
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)] as number;
    // Pure normalization must stay sub-millisecond; reported so resume
    // bullets can cite a measured number instead of "~40%".
    expect(median).toBeLessThan(5);
  });
});
