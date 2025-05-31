"use server";

import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { userInteractions, artworks, artists } from "~/server/db/schema";
import { logger } from "~/utils/logger";
import { ApiResponse } from "~/lib/types/api";
import {
  UserFavorites,
  ToggleFavorite,
  ToggleFavoriteParams,
} from "~/lib/types/favorite";

/**
 * Toggle favorite status for an artwork using an efficient upsert pattern
 */
export async function toggleFavorite(
  params: ToggleFavoriteParams,
): Promise<ApiResponse<ToggleFavorite>> {
  const log = logger.child({
    action: "toggleFavorite",
    userId: params.userId,
    artworkId: params.artworkId,
  });

  // Validate inputs
  if (!params.userId || !params.artworkId) {
    log.warn("Invalid inputs", { params });
    return {
      success: false,
      error: "Missing required parameters",
    };
  }

  try {
    // Use transaction for consistency
    return await db.transaction(async (tx) => {
      // Check if the interaction exists
      const existingInteraction = await tx
        .select({
          id: userInteractions.id,
          isFavorite: userInteractions.isFavorite,
        })
        .from(userInteractions)
        .where(
          and(
            eq(userInteractions.userId, params.userId),
            eq(userInteractions.artworkId, params.artworkId),
          ),
        )
        .limit(1)
        .then(rows => rows[0]);

      let isFavorite: boolean;
      
      if (existingInteraction) {
        // Update existing interaction
        isFavorite = !existingInteraction.isFavorite;
        
        await tx
          .update(userInteractions)
          .set({
            isFavorite,
            updatedAt: new Date(),
          })
          .where(eq(userInteractions.id, existingInteraction.id));
          
        log.info("Favorite status updated", { 
          interactionId: existingInteraction.id,
          newStatus: isFavorite 
        });
      } else {
        // Create new interaction with favorite flag
        isFavorite = true;
        
        await tx.insert(userInteractions).values({
          userId: params.userId,
          artworkId: params.artworkId,
          isFavorite,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        log.info("New favorite created", { isFavorite });
      }

      return { 
        success: true, 
        data: { isFavorite } 
      };
    });
  } catch (error) {
    log.error("Failed to toggle favorite", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Failed to toggle favorite status",
    };
  }
}

/**
 * Get all favorites for a user with pagination support
 */
export async function getFavorites(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<UserFavorites>> {
  const log = logger.child({
    action: "getFavorites",
    userId,
    page,
    pageSize,
  });

  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Calculate pagination offsets
    const offset = (page - 1) * pageSize;

    // Select only necessary fields for better performance
    const favorites = await db
      .select({
        id: userInteractions.id,
        createdAt: userInteractions.createdAt,
        artwork: {
          contentId: artworks.contentId,
          title: artworks.title,
          image: artworks.image,
          completitionYear: artworks.completitionYear,
          yearAsString: artworks.yearAsString,
          artistContentId: artworks.artistContentId,
          // Include other essential fields but avoid overfetching
          style: artworks.style,
          genre: artworks.genre,
          period: artworks.period,
        },
        artist: {
          contentId: artists.contentId,
          artistName: artists.artistName,
          image: artists.image,
          url: artists.url,
          // Include other essential fields but avoid overfetching
          birthDayAsString: artists.birthDayAsString,
          deathDayAsString: artists.deathDayAsString,
        },
      })
      .from(userInteractions)
      .innerJoin(artworks, eq(userInteractions.artworkId, artworks.contentId))
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .orderBy(desc(userInteractions.createdAt))
      .limit(pageSize)
      .offset(offset);

    log.info("Retrieved favorites", { count: favorites.length, page, pageSize });
    
    return { 
      success: true, 
      data: favorites,
    };
  } catch (error) {
    log.error("Failed to get favorites", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to retrieve favorites",
    };
  }
}

/**
 * Clear all favorites for a user
 */
export async function clearFavorites(userId: string): Promise<ApiResponse<void>> {
  const log = logger.child({
    action: "clearFavorites",
    userId,
  });

  // Validate input
  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
    };
  }

  try {
    // Get count of favorites before clearing for logging
    const { count } = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .then(rows => rows[0] || { count: 0 });

    // Use transaction for atomic operation
    await db.transaction(async (tx) => {
      await tx
        .update(userInteractions)
        .set({
          isFavorite: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userInteractions.userId, userId),
            eq(userInteractions.isFavorite, true),
          )
        );
    });

    log.info("Favorites cleared successfully", { clearedCount: count });
    return { success: true };
  } catch (error) {
    log.error("Failed to clear favorites", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to clear favorites",
    };
  }
}

/**
 * Check if an artwork is favorited by a user
 */
export async function checkIsFavorite(
  userId: string, 
  artworkId: number
): Promise<ApiResponse<ToggleFavorite>> {
  const log = logger.child({
    action: "checkIsFavorite",
    userId,
    artworkId,
  });

  // Validate inputs
  if (!userId || !artworkId) {
    log.warn("Invalid inputs", { userId, artworkId });
    return {
      success: false,
      error: "Missing required parameters",
      data: { isFavorite: false },
    };
  }

  try {
    // Optimized query to only check existence
    const { isFavorited } = await db
      .select({
        isFavorited: sql<boolean>`EXISTS (
          SELECT 1 FROM user_interaction 
          WHERE user_id = ${userId} 
          AND artwork_id = ${artworkId} 
          AND is_favorite = true
        )`,
      })
      .from(userInteractions)
      .limit(1)
      .then(rows => rows[0] || { isFavorited: false });

    log.debug("Favorite status checked", { isFavorite: isFavorited });
    
    return { 
      success: true, 
      data: { isFavorite: isFavorited } 
    };
  } catch (error) {
    log.error("Failed to check favorite status", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to check favorite status",
      data: { isFavorite: false },
    };
  }
}

/**
 * Get favorite counts for a user
 * Utility function to display counts on UI
 */
export async function getFavoritesCount(
  userId: string
): Promise<ApiResponse<{count: number}>> {
  const log = logger.child({
    action: "getFavoritesCount",
    userId,
  });

  try {
    const { count } = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .then(rows => rows[0] || { count: 0 });

    return {
      success: true,
      data: { count },
    };
  } catch (error) {
    log.error("Failed to get favorites count", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to retrieve favorites count",
      data: { count: 0 },
    };
  }
}