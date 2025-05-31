"use server";

import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { viewingHistory, artworks, artists } from "~/server/db/schema";
import { upsertArtwork } from "~/server/actions/content/artwork-to-db";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";

/**
 * Response interface for history-related operations
 */
interface HistoryOperationResult {
  success: boolean;
  error?: string;
  details?: string;
}

/**
 * History entry with artwork and artist details 
 */
interface ViewingHistoryEntry {
  id: number;
  viewedAt: Date;
  artwork: {
    contentId: number;
    title: string;
    image: string;
    yearAsString: string | null;
  };
  artist: {
    contentId: number;
    artistName: string;
    url: string;
  };
}

/**
 * Paginated history response
 */
interface PaginatedHistoryResult {
  entries: ViewingHistoryEntry[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Adds an artwork to a user's viewing history
 * Prevents duplicate entries within a short timeframe
 * 
 * @param userId - User's unique identifier
 * @param artwork - Detailed artwork information to add to history
 * @returns Operation result with success status and error details if applicable
 */
export async function addToHistory(
  userId: string, 
  artwork: ArtworkDetailed
): Promise<HistoryOperationResult> {
  const logContext = {
    action: "addToHistory",
    userId,
    artworkId: artwork.contentId,
  };

  try {
    // Ensure the artwork exists in the database
    const artworkResult = await upsertArtwork(artwork);

    if (!artworkResult.success) {
      logger.error("Failed to ensure artwork exists", {
        ...logContext,
        error: artworkResult.error,
      });
      return {
        success: false,
        error: "Failed to ensure artwork exists in database",
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
          sql`${viewingHistory.viewedAt} > NOW() - INTERVAL '1 minute'`,
        ),
      )
      .limit(1);

    // Insert viewing history if no recent view is found
    if (recentView.length === 0) {
      // Verify artwork exists before inserting
      const existingArtwork = await db.query.artworks.findFirst({
        where: eq(artworks.contentId, artwork.contentId),
      });

      if (!existingArtwork) {
        logger.error("Artwork not found in database", logContext);
        return {
          success: false,
          error: "Artwork not found in database",
        };
      }

      await db.insert(viewingHistory).values({
        userId,
        artworkId: artwork.contentId,
        viewedAt: new Date(),
      });

      logger.info("Successfully added to history", logContext);
    } else {
      logger.info("Recent view exists, skipping insert", logContext);
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to add to history", {
      ...logContext,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Failed to add to viewing history",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Retrieves user's viewing history with pagination
 * Includes related artwork and artist information
 * 
 * @param userId - User's unique identifier
 * @param page - Page number (1-based indexing)
 * @param pageSize - Number of entries per page
 * @returns Array of viewing history entries with artwork and artist details
 */
export async function getViewingHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<ViewingHistoryEntry[]> {
  const logContext = {
    action: "getViewingHistory",
    userId,
    page,
    pageSize,
  };

  try {
    logger.info("Fetching viewing history", logContext);

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
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    logger.info("Successfully retrieved viewing history", {
      ...logContext,
      entriesCount: history.length,
    });

    return history;
  } catch (error) {
    logger.error("Failed to get viewing history", {
      ...logContext,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return [];
  }
}

/**
 * Enhanced viewing history retrieval with pagination metadata
 * 
 * @param userId - User's unique identifier
 * @param page - Page number (1-based indexing)
 * @param pageSize - Number of entries per page
 * @returns Paginated result with history entries and pagination metadata
 */
export async function getPaginatedViewingHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedHistoryResult> {
  const logContext = {
    action: "getPaginatedViewingHistory",
    userId,
    page,
    pageSize,
  };

  try {
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewingHistory)
      .where(eq(viewingHistory.userId, userId));

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Get history entries
    const entries = await getViewingHistory(userId, page, pageSize);

    logger.info("Successfully retrieved paginated viewing history", {
      ...logContext,
      totalCount,
      totalPages,
      entriesCount: entries.length,
    });

    return {
      entries,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error("Failed to get paginated viewing history", {
      ...logContext,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      entries: [],
      pagination: {
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        pageSize,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

/**
 * Clears all viewing history for a specific user
 * 
 * @param userId - User's unique identifier 
 * @returns Operation result with success status and error details if applicable
 */
export async function clearHistory(userId: string): Promise<HistoryOperationResult> {
  const logContext = {
    action: "clearHistory",
    userId,
  };
  
  try {
    logger.info("Attempting to clear viewing history", logContext);
    
    // Get count before deletion for logging
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewingHistory)
      .where(eq(viewingHistory.userId, userId));
    
    const entriesCount = Number(countResult[0]?.count ?? 0);
    
    // Delete all history entries for the user
    await db.delete(viewingHistory).where(eq(viewingHistory.userId, userId));
    
    logger.info("Successfully cleared viewing history", {
      ...logContext,
      entriesDeleted: entriesCount,
    });
    
    return { success: true };
  } catch (error) {
    logger.error("Failed to clear history", {
      ...logContext,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return { 
      success: false, 
      error: "Failed to clear history",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Removes a specific entry from the user's viewing history
 * 
 * @param userId - User's unique identifier
 * @param historyId - ID of the viewing history entry to remove
 * @returns Operation result with success status and error details if applicable
 */
export async function removeHistoryEntry(
  userId: string, 
  historyId: number
): Promise<HistoryOperationResult> {
  const logContext = {
    action: "removeHistoryEntry",
    userId,
    historyId,
  };
  
  try {
    logger.info("Attempting to remove history entry", logContext);
    
    // Verify the entry belongs to the user before deletion
    const entry = await db
      .select()
      .from(viewingHistory)
      .where(
        and(
          eq(viewingHistory.id, historyId),
          eq(viewingHistory.userId, userId)
        )
      )
      .limit(1);
    
    if (entry.length === 0) {
      logger.warn("History entry not found or does not belong to user", logContext);
      return {
        success: false,
        error: "History entry not found",
      };
    }
    
    // Delete the specific entry
    await db
      .delete(viewingHistory)
      .where(
        and(
          eq(viewingHistory.id, historyId),
          eq(viewingHistory.userId, userId)
        )
      );
    
    logger.info("Successfully removed history entry", logContext);
    
    return { success: true };
  } catch (error) {
    logger.error("Failed to remove history entry", {
      ...logContext,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return { 
      success: false, 
      error: "Failed to remove history entry",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}