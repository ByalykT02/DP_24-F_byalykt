"use server";

import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { viewingHistory, artworks, artists } from "~/server/db/schema";
import { upsertArtwork } from "./artwork-to-db";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";

// Add artwork to viewing history
export async function addToHistory(userId: string, artwork: ArtworkDetailed) {
  const logContext = {
    action: 'addToHistory',
    userId,
    artworkId: artwork.contentId,
  };

  try {
    // Ensure the artwork exists in the database
    const artworkResult = await upsertArtwork(artwork);
    console.log("artworkResult", artwork);
    if (!artworkResult.success) {
      logger.error('Failed to ensure artwork exists', {
        ...logContext,
        error: artworkResult.error,
      });
      return { 
        success: false, 
        error: 'Failed to ensure artwork exists in database',
      };
    }

    // Prevent duplicate views within the last minute
    const recentView = await db
      .select()
      .from(viewingHistory)
      .where(
        and(
          eq(viewingHistory.userId, userId),
          eq(viewingHistory.artworkId, artwork.contentId),
          sql`${viewingHistory.viewedAt} > NOW() - INTERVAL '1 minute'`
        )
      )
      .limit(1);

    // Insert viewing history if no recent view is found
    if (recentView.length === 0) {
      // Verify artwork exists before inserting
      const existingArtwork = await db.query.artworks.findFirst({
        where: eq(artworks.contentId, artwork.contentId),
      });

      if (!existingArtwork) {
        logger.error('Artwork not found in database', logContext);
        return {
          success: false,
          error: 'Artwork not found in database',
        };
      }

      await db.insert(viewingHistory).values({
        userId,
        artworkId: artwork.contentId,
        viewedAt: new Date(),
      });

      logger.info('Successfully added to history', logContext);
    } else {
      logger.info('Recent view exists, skipping insert', logContext);
    }

    return { success: true };

  } catch (error) {
    logger.error('Failed to add to history', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: 'Failed to add to viewing history',
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

// Get viewing history for a user
export async function getViewingHistory(userId: string) {
  try {
    const history = await db
      .select({
        id: viewingHistory.id,
        viewedAt: viewingHistory.viewedAt,
        artwork: {
          contentId: artworks.contentId,
          title: artworks.title,
          image: artworks.image,
          yearAsString: artworks.yearAsString,
        },
        artist: {
          contentId: artists.contentId,
          artistName: artists.artistName,
          url: artists.url,
        },
      })
      .from(viewingHistory)
      .innerJoin(artworks, eq(viewingHistory.artworkId, artworks.contentId))
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(eq(viewingHistory.userId, userId))
      .orderBy(desc(viewingHistory.viewedAt))
      .limit(50);

    return history;

  } catch (error) {
    console.error("Failed to get viewing history:", error);
    return [];
  }
}

// Clear the viewing history for a user
export async function clearHistory(userId: string) {
  try {
    await db.delete(viewingHistory).where(eq(viewingHistory.userId, userId));
    return { success: true };
  } catch (error) {
    console.error("Failed to clear history:", error);
    return { success: false, error: "Failed to clear history" };
  }
}
