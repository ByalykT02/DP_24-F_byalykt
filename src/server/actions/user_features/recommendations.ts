"use server";

import { db } from "~/server/db";
import { and, ne, between, eq } from "drizzle-orm";
import { artworks, artists } from "~/server/db/schema";
import type {
  ArtworkRecommendation,
  ReferenceArtwork,
} from "~/lib/types/artwork";
import { logger } from "~/utils/logger";

export interface RecommendationParams {
  artistId: number;
  limit?: number;
  includeTimeRange?: boolean;
  diversityFactor?: number;
}

interface ScorableArtwork {
  image?: string | null;
  style?: string | null;
  genre?: string | null;
  period?: string | null;
  technique?: string | null;
  tags?: string | null;
  // Drizzle `json` columns type as `unknown` on reads.
  dictionaries?: unknown;
  completitionYear?: number | null;
  artist?: { contentId?: number | null } | null;
}

/** Weighted factors for the Jaccard + time-decay similarity score. */
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

/** Linear decay over a 100-year window: 1.0 for same year, 0.0 beyond 100 years. */
export function calculateTimeDistance(
  yearA?: number | null,
  yearB?: number | null,
): number {
  if (!yearA || !yearB) return 0;

  const distance = Math.abs(yearA - yearB);
  return Math.max(0, 1 - distance / 100);
}

async function getArtworkDetails(artistId: number) {
  // Fetch reference artwork details
  const referenceArtwork = await db
    .select({
      contentId: artworks.contentId,
      completitionYear: artworks.completitionYear,
      tags: artworks.tags,
      dictionaries: artworks.dictionaries,
      style: artworks.style,
      genre: artworks.genre,
      period: artworks.period,
      technique: artworks.technique,
    })
    .from(artworks)
    .where(eq(artworks.artistContentId, artistId))
    .limit(1)
    .then((results) => results[0] || null);

  return referenceArtwork;
}

export function calculateTagSimilarity(
  tagsA: string | null | undefined,
  tagsB: string | null | undefined,
): number {
  if (!tagsA || !tagsB) return 0;

  const setA = new Set(tagsA.split(",").map((t) => t.trim()).filter(Boolean));
  const setB = new Set(tagsB.split(",").map((t) => t.trim()).filter(Boolean));

  if (setA.size === 0 || setB.size === 0) return 0;
  const tagIntersection = new Set([...setA].filter((x) => setB.has(x)));
  const tagUnion = new Set([...setA, ...setB]);

  return tagUnion.size === 0 ? 0 : tagIntersection.size / tagUnion.size;
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

/**
 * Weighted Jaccard + time-decay similarity between a candidate artwork and
 * the reference artwork. Exported for unit testing the ranking operation.
 */
export function calculateSimilarityScore(
  artwork: ScorableArtwork,
  reference: ScorableArtwork,
  artistId: number,
  diversityFactor: number,
): number {
  const weights = RECOMMENDATION_WEIGHTS;

  const metrics = {
    sameArtist: artwork.artist?.contentId === artistId ? 1 : 0,
    style: artwork.style === reference.style ? 1 : 0,
    genre: artwork.genre === reference.genre ? 1 : 0,
    period: artwork.period === reference.period ? 1 : 0,
    technique: artwork.technique === reference.technique ? 1 : 0,
    tags: calculateTagSimilarity(artwork.tags, reference.tags),
    dictionaries: calculateDictionarySimilarity(
      Array.isArray(artwork.dictionaries)
        ? (artwork.dictionaries as number[])
        : null,
      Array.isArray(reference.dictionaries)
        ? (reference.dictionaries as number[])
        : null,
    ),
    time: calculateTimeDistance(
      artwork.completitionYear,
      reference.completitionYear,
    ),
  };

  let score = Object.entries(metrics).reduce((sum, [key, value]) => {
    return sum + value * weights[key as keyof typeof weights];
  }, 0);

  if (diversityFactor > 0) {
    // Reduce the weight of same-artist bonus to encourage diversity
    score = score * (1 - metrics.sameArtist * diversityFactor);
  }

  return score;
}

/**
 * Coerces a Drizzle `json` dictionaries column value to `number[] | null`.
 * Non-numeric entries are dropped so downstream Jaccard math stays numeric.
 */
export function toDictionaryIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.filter((v): v is number => typeof v === "number");
  return ids.length === value.length ? ids : ids;
}

export async function getRecommendations({
  artistId,
  limit = 25,
  includeTimeRange = true,
  diversityFactor = 0.3,
}: RecommendationParams) {
  try {
    const reference = await getArtworkDetails(artistId);

    if (!reference) {
      logger.info("No reference artwork found for the given artistId.");
      return [];
    }

    const timeRange =
      includeTimeRange && reference.completitionYear
        ? {
            min: reference.completitionYear - 50,
            max: reference.completitionYear + 50,
          }
        : null;

    const recommendedArtworks = await db
      .select({
        contentId: artworks.contentId,
        title: artworks.title,
        image: artworks.image,
        yearAsString: artworks.yearAsString,
        completitionYear: artworks.completitionYear,
        tags: artworks.tags,
        dictionaries: artworks.dictionaries,
        style: artworks.style,
        genre: artworks.genre,
        period: artworks.period,
        technique: artworks.technique,
        artist: {
          contentId: artists.contentId,
          artistName: artists.artistName,
        },
      })
      .from(artworks)
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(
        and(
          // Exclude the current artwork
          ne(artworks.contentId, reference.contentId),
          timeRange
            ? between(artworks.completitionYear, timeRange.min, timeRange.max)
            : undefined,
        ),
      );

    const scoredArtworks = recommendedArtworks
      .map((artwork) => ({
        ...artwork,
        score: calculateSimilarityScore(
          artwork,
          reference,
          artistId,
          diversityFactor,
        ),
      }))
      .sort((a, b) => b.score - a.score);

    // Apply artist diversity constraints
    const maxArtworksPerArtist = Math.max(
      1,
      Math.ceil(limit * (1 - diversityFactor)),
    );
    const artistArtworkCount: Record<number, number> = {};
    const filteredArtworks = scoredArtworks.filter((artwork) => {
      const artistId = artwork.artist?.contentId;
      if (!artistId) return false;

      artistArtworkCount[artistId] = (artistArtworkCount[artistId] || 0) + 1;
      return artistArtworkCount[artistId] <= maxArtworksPerArtist;
    });

    const finalRecommendations = filteredArtworks.slice(0, limit);

    return finalRecommendations.map((artwork) =>
      processArtwork({
        ...artwork,
        dictionaries: toDictionaryIds(artwork.dictionaries),
      }),
    );
  } catch (error) {
    logger.error("Failed to get artwork recommendations", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
