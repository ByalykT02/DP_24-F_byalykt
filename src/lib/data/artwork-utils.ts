import type { ArtworkDetailed } from "~/lib/types/artwork";

export const FALLBACK_ARTWORK: ArtworkDetailed = {
  artistUrl: "alphonse-mucha",
  url: "holy-mount-athos-1926",
  dictionaries: [482, 494],
  location: null,
  period: null,
  serie: null,
  genre: "religious painting",
  material: null,
  style: "Symbolism",
  technique: null,
  auction: null,
  yearOfTrade: null,
  lastPrice: null,
  galleryName: "Mucha Museum, Prague, Czech Republic",
  tags: "priests-and-sacraments, Sky",
  description: null,
  title: "Holy Mount Athos",
  contentId: 227658,
  artistContentId: 227598,
  artistName: "Mucha Alphonse",
  completitionYear: 1926,
  yearAsString: "1926",
  width: "1983",
  height: "1689",
  image:
    "https://uploads7.wikiart.org/images/alphonse-mucha/holy-mount-athos-1926.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const WIKIART_IMAGE_SIZE_SUFFIX_PATTERN =
  /!(Large|Portrait|Square|PinterestSmall)\.jpg$/g;

export function cleanWikiArtImageUrl(image: string): string {
  return image.replace(WIKIART_IMAGE_SIZE_SUFFIX_PATTERN, "");
}

export function cleanWikiArtDescription(description: string): string {
  return description.replace(/\[.*?\]/g, "").trim();
}

export function coerceArtworkDimension(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isNaN(num) ? null : String(num);
}

export function processArtworkData(
  artwork: Partial<ArtworkDetailed>,
): ArtworkDetailed {
  if (!artwork || typeof artwork !== "object") {
    return FALLBACK_ARTWORK;
  }

  const processed: ArtworkDetailed = {
    contentId: artwork.contentId ?? FALLBACK_ARTWORK.contentId,
    artistContentId:
      artwork.artistContentId ?? FALLBACK_ARTWORK.artistContentId,
    artistName: artwork.artistName ?? FALLBACK_ARTWORK.artistName,
    artistUrl: artwork.artistUrl ?? FALLBACK_ARTWORK.artistUrl,
    title: artwork.title ?? FALLBACK_ARTWORK.title,
    image: artwork.image ?? FALLBACK_ARTWORK.image,
    url: artwork.url ?? null,
    completitionYear: artwork.completitionYear
      ? Number(artwork.completitionYear)
      : null,
    yearAsString: artwork.yearAsString ?? null,
    genre: artwork.genre ?? null,
    style: artwork.style ?? null,
    tags: artwork.tags ?? null,
    dictionaries: Array.isArray(artwork.dictionaries)
      ? artwork.dictionaries
      : null,
    width: coerceArtworkDimension(artwork.width),
    height: coerceArtworkDimension(artwork.height),
    material: artwork.material ?? null,
    technique: artwork.technique ?? null,
    location: artwork.location ?? null,
    period: artwork.period ?? null,
    serie: artwork.serie ?? null,
    galleryName: artwork.galleryName ?? null,
    auction: artwork.auction ?? null,
    yearOfTrade: artwork.yearOfTrade ? Number(artwork.yearOfTrade) : null,
    lastPrice: artwork.lastPrice ? artwork.lastPrice : null,
    description: artwork.description ?? null,
    createdAt: artwork.createdAt ?? new Date(),
    updatedAt: artwork.updatedAt ?? new Date(),
  };

  if (processed.image) {
    processed.image = cleanWikiArtImageUrl(processed.image);
  }
  if (processed.description) {
    processed.description = cleanWikiArtDescription(processed.description);
  }

  return processed;
}
