"use server";

import { db } from "~/server/db";
import { and, ne, between, eq } from "drizzle-orm";
import { artworks, artists } from "~/server/db/schema";
import type {
  ArtworkRecommendation,
  ReferenceArtwork,
} from "~/lib/types/artwork";
import { logger } from "~/utils/logger";
import {
  calculateDictionarySimilarity,
  calculateSimilarityScore,
  calculateTagSimilarity,
  calculateTimeDistance,
  processArtwork,
  toDictionaryIds,
} from "~/lib/data/recommendation-utils";

export interface RecommendationParams {
  artistId: number;
  limit?: number;
  includeTimeRange?: boolean;
  diversityFactor?: number;
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
