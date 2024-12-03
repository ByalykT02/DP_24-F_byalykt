"use server";

import { db } from "~/server/db";
import { desc, eq, and, sql, not, or } from "drizzle-orm";
import { 
  artworks, 
  artists, 
  viewingHistory, 
  userInteractions,
  userPreferences 
} from "~/server/db/schema";

interface RecommendationParams {
  userId: string;
  limit?: number;
  excludeIds?: number[];
}

export async function getRecommendations({ 
  userId, 
  limit = 12,
  excludeIds = [] 
}: RecommendationParams) {
  try {
    // Get user preferences
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId)
    });

    // Get user's recently viewed artworks
    const recentViews = await db
      .select({ artworkId: viewingHistory.artworkId })
      .from(viewingHistory)
      .where(eq(viewingHistory.userId, userId))
      .orderBy(desc(viewingHistory.viewedAt))
      .limit(10);

    // Get user's favorite artists (from interactions)
    const favoriteArtists = await db
      .select({ artistId: artists.contentId })
      .from(userInteractions)
      .innerJoin(artworks, eq(userInteractions.artworkId, artworks.contentId))
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.isFavorite, true)
        )
      )
      .groupBy(artists.contentId);

    // Build recommendation query
    let query = db
      .select({
        contentId: artworks.contentId,
        title: artworks.title,
        image: artworks.image,
        yearAsString: artworks.yearAsString,
        artist: {
          contentId: artists.contentId,
          artistName: artists.artistName,
        },
      })
      .from(artworks)
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(
        and(
          // Exclude already viewed/interacted artworks
          not(sql`${artworks.contentId} = ANY(${sql`ARRAY[${excludeIds.join(',')}]`})`),
          
          // Match user preferences if available
          preferences?.preferredStyles 
            ? sql`${artworks.style} && ${sql`${preferences.preferredStyles}`}` 
            : sql`1=1`,
          preferences?.preferredPeriods
            ? sql`${artworks.period} && ${sql`${preferences.preferredPeriods}`}`
            : sql`1=1`,
            
          // Boost artworks from favorite artists
          favoriteArtists.length > 0
            ? or(
                ...favoriteArtists.map(({ artistId }) =>
                  eq(artworks.artistContentId, artistId)
                )
              )
            : sql`1=1`
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    const recommendations = await query;

    return recommendations;
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return [];
  }
}