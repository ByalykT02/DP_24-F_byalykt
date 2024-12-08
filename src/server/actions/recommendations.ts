"use server";

import { db } from "~/server/db";
import { eq, and, or, sql, ne } from "drizzle-orm";
import { artworks, artists } from "~/server/db/schema";
import { ArtworkDetailed } from "~/lib/types/artwork";

interface RecommendationParams {
  artistId: number;
  limit?: number;
}

function processArtwork(artwork: any) {
  return {
    ...artwork,
    image: artwork.image?.replace("!Large.jpg", ""),
  };
}

async function getArtworkDetails(artistId: number) {
  // Fetch reference artwork details
  const referenceArtwork = await db
    .select({
      contentId: artworks.contentId,
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
    .then((results) => results[0] || null); // Handle empty results gracefully

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

export async function getRecommendations({
  artistId,
  limit = 25,
}: RecommendationParams) {
  try {
    console.log(`Fetching reference artwork for artistId: ${artistId}`);
    const referenceArtwork = await getArtworkDetails(artistId);

    if (!referenceArtwork) {
      console.log("No reference artwork found for the given artistId.");
      return [];
    }
    console.log(
      "Reference artwork details:",
      JSON.stringify(referenceArtwork, null, 2),
    );

    const recommendedArtworks = await db
      .select({
        contentId: artworks.contentId,
        title: artworks.title,
        image: artworks.image,
        yearAsString: artworks.yearAsString,
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
          ne(artworks.contentId, referenceArtwork.contentId),
        ),
      );
    // .limit(limit * 2);

    console.log(`Fetched ${recommendedArtworks.length} artworks for scoring.`);

    const scoredArtworks = recommendedArtworks
      .map((artwork) => {
        const tagSimilarity = calculateTagSimilarity(
          artwork.tags,
          referenceArtwork.tags,
        );
        const dictionarySimilarity = calculateDictionarySimilarity(
          artwork.dictionaries,
          referenceArtwork.dictionaries,
        );

        const score =
          (artwork.artist?.contentId === artistId ? 1 : 0) +
          (artwork.style === referenceArtwork.style ? 2 : 0) +
          (artwork.genre === referenceArtwork.genre ? 2 : 0) +
          (artwork.period === referenceArtwork.period ? 1 : 0) +
          (artwork.technique === referenceArtwork.technique ? 1 : 0) +
          tagSimilarity * 3 +
          dictionarySimilarity * 3;

        // console.log(
        //   `Artwork ${artwork.contentId} (${artwork.title}) - Score: ${score}, Tag Similarity: ${tagSimilarity}, Dictionary Similarity: ${dictionarySimilarity}`,
        // );
        console.log(
          `Artwork ${artwork.title} ---- ${artwork.artist.artistName}`,
        );
        return { ...artwork, score };
      })
      .sort((a, b) => b.score - a.score);

    const artistArtworkCount: Record<number, number> = {};
    const filteredArtworks = scoredArtworks.filter((artwork) => {
      const artistId = artwork.artist?.contentId;
      if (!artistId) return false;

      artistArtworkCount[artistId] = (artistArtworkCount[artistId] || 0) + 1;
      return artistArtworkCount[artistId] <= 3;
    });

    // Take only the top `limit` results after applying constraints
    const finalRecommendations = filteredArtworks.slice(0, limit);

    console.log(
      `Returning top ${limit} recommendations after applying artist constraints.`,
    );
    return finalRecommendations.map(processArtwork);
  } catch (error) {
    console.error("Failed to get artwork recommendations:", error);
    return [];
  }
}
