interface ScorableArtwork {
  image?: string | null;
  style?: string | null;
  genre?: string | null;
  period?: string | null;
  technique?: string | null;
  tags?: string | null;
  dictionaries?: unknown;
  completitionYear?: number | null;
  artist?: { contentId?: number | null } | null;
}

export const RECOMMENDATION_WEIGHTS = {
  sameArtist: 1.5,
  style: 2.5,
  genre: 2.0,
  period: 1.5,
  technique: 1.5,
  tags: 3.0,
  dictionaries: 2.5,
  time: 1.0,
} as const;

export function processArtwork<T extends { image?: string | null }>(artwork: T): T {
  return {
    ...artwork,
    image: artwork.image?.replace("!Large.jpg", "") ?? artwork.image,
  };
}

export function calculateTimeDistance(
  yearA?: number | null,
  yearB?: number | null,
): number {
  if (!yearA || !yearB) return 0;
  const distance = Math.abs(yearA - yearB);
  return Math.max(0, 1 - distance / 100);
}

export function calculateTagSimilarity(
  tagsA: string | null | undefined,
  tagsB: string | null | undefined,
): number {
  if (!tagsA || !tagsB) return 0;
  const setA = new Set(tagsA.split(",").map((t) => t.trim()).filter(Boolean));
  const setB = new Set(tagsB.split(",").map((t) => t.trim()).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function calculateDictionarySimilarity(
  dictA: number[] | null | undefined,
  dictB: number[] | null | undefined,
): number {
  if (!dictA || !dictB) return 0;
  const setA = new Set(dictA);
  const setB = new Set(dictB);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function calculateSimilarityScore(
  artwork: ScorableArtwork,
  reference: ScorableArtwork,
  artistId: number,
  diversityFactor: number,
): number {
  const metrics = {
    sameArtist: artwork.artist?.contentId === artistId ? 1 : 0,
    style: artwork.style === reference.style ? 1 : 0,
    genre: artwork.genre === reference.genre ? 1 : 0,
    period: artwork.period === reference.period ? 1 : 0,
    technique: artwork.technique === reference.technique ? 1 : 0,
    tags: calculateTagSimilarity(artwork.tags, reference.tags),
    dictionaries: calculateDictionarySimilarity(
      Array.isArray(artwork.dictionaries) ? artwork.dictionaries as number[] : null,
      Array.isArray(reference.dictionaries) ? reference.dictionaries as number[] : null,
    ),
    time: calculateTimeDistance(
      artwork.completitionYear,
      reference.completitionYear,
    ),
  };

  let score = Object.entries(metrics).reduce((sum, [key, value]) => {
    return sum + value * RECOMMENDATION_WEIGHTS[key as keyof typeof RECOMMENDATION_WEIGHTS];
  }, 0);

  if (diversityFactor > 0) {
    score = score * (1 - metrics.sameArtist * diversityFactor);
  }
  return score;
}

export function toDictionaryIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is number => typeof v === "number");
}
