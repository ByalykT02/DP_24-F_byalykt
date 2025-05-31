"use server";

import { db } from "~/server/db";
import { eq, and, or, sql, ne, between } from "drizzle-orm";
import { artworks, artists } from "~/server/db/schema";
import { ArtworkRecommendation, ArtworkDetailed } from "~/lib/types/artwork";

interface RecommendationParams {
  artistId: number;
  limit?: number;
  includeTimeRange?: boolean;
  diversityFactor?: number;
}

function processArtwork(artwork: any) {
  return {
    ...artwork,
    image: artwork.image?.replace("!Large.jpg", ""),
  };
}

function calculateTimeDistance(yearA?: number, yearB?: number): number {
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

function calculateTagSimilarity(
  tagsA: string | null,
  tagsB: string | null,
): number {
  if (!tagsA || !tagsB) return 0;

  const setA = new Set(tagsA.split(",").map((t) => t.trim()));
  const setB = new Set(tagsB.split(",").map((t) => t.trim()));

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

function calculateDictionarySimilarity(
  dictA: number[] | null,
  dictB: number[] | null,
): number {
  if (!dictA || !dictB) return 0;

  const setA = new Set(dictA);
  const setB = new Set(dictB);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

function calculateSimilarityScore(
  artwork: any,
  reference: any,
  artistId: number,
  diversityFactor: number,
): number {
  const weights = {
    sameArtist: 1.5,
    style: 2.5,
    genre: 2.0,
    period: 1.5,
    technique: 1.5,
    tags: 3.0,
    dictionaries: 2.5,
    time: 1.0,
  };

  const metrics = {
    sameArtist: artwork.artist?.contentId === artistId ? 1 : 0,
    style: artwork.style === reference.style ? 1 : 0,
    genre: artwork.genre === reference.genre ? 1 : 0,
    period: artwork.period === reference.period ? 1 : 0,
    technique: artwork.technique === reference.technique ? 1 : 0,
    tags: calculateTagSimilarity(artwork.tags, reference.tags),
    dictionaries: calculateDictionarySimilarity(
      artwork.dictionaries,
      reference.dictionaries,
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

export async function getRecommendations({
  artistId,
  limit = 25,
  includeTimeRange = true,
  diversityFactor = 0.3,
}: RecommendationParams) {
  try {
    const reference = await getArtworkDetails(artistId);

    if (!reference) {
      console.log("No reference artwork found for the given artistId.");
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

    return finalRecommendations.map(processArtwork);
  } catch (error) {
    console.error("Failed to get artwork recommendations:", error);
    return [];
  }
}
