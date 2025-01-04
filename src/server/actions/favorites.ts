"use server";

import { desc, eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { userInteractions, artworks, artists } from "~/server/db/schema";
import { logging } from "~/utils/logger";
import { ApiResponse } from "~/lib/types/api";
import {
  UserFavorites,
  ToggleFavorite,
  ToggleFavoriteParams,
  UserFavorite,
} from "~/lib/types/favorite";

/**
 * Toggle favorite status for an artwork
 */
export async function toggleFavorite(
  params: ToggleFavoriteParams,
): Promise<ApiResponse<ToggleFavorite>> {
  const logger = logging.child({
    action: "toggleFavorite",
    userId: params.userId,
    artworkId: params.artworkId,
  });

  try {
    // Check if the artwork is already favorited
    const existingFavorite = await db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, params.userId),
          eq(userInteractions.artworkId, params.artworkId),
        ),
      )
      .limit(1);

    let result;

    if (existingFavorite[0]) {
      const newStatus = !existingFavorite[0]?.isFavorite;
      await db
        .update(userInteractions)
        .set({
          isFavorite: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(userInteractions.id, existingFavorite[0].id));

      result = { success: true, data: { isFavorite: newStatus } };
      logger.info("Favorite status updated successfully", result);
    } else {
      await db.insert(userInteractions).values({
        userId: params.userId,
        artworkId: params.artworkId,
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result = { success: true, data: { isFavorite: true } };
      logger.info("New favorite created successfully", result);
    }

    return result;
  } catch (error) {
    logger.error("Failed to toggle favorite", error);
    if (error instanceof Error) {
      logging.error("Failed to toggle favorite", error);
    } else {
      logging.error("Failed to toggle favorite", { message: String(error) });
    }

    return {
      success: false,
      error: "Failed to toggle favorite status",
    };
  }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(
  userId: string,
): Promise<ApiResponse<UserFavorites>> {
  const logger = logging.child({
    action: "getFavorites",
    userId,
  });

  try {
    const favorites = await db
      .select({
        id: userInteractions.id,
        artwork: artworks,
        artist: artists,
        createdAt: userInteractions.createdAt,
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
      .orderBy(desc(userInteractions.createdAt));

    logger.info(`Retrieved ${favorites.length} favorites`);
    return { success: true, data: favorites };
  } catch (error) {
    logger.error("Failed to get favorite", error);
    if (error instanceof Error) {
      logging.error("Failed to get favorite", error);
    } else {
      logging.error("Failed to get favorite", { message: String(error) });
    }
    return {
      success: false,
      error: "Failed to toggle favorite status",
    };
  }
}

/**
 * Clear all favorites for a user
 */
export async function clearFavorites(userId: string):Promise<ApiResponse<void>> {
  const logger = logging.child({
    action: "clearFavorites",
    userId,
  });

  try {
    await db
      .update(userInteractions)
      .set({
        isFavorite: false,
        updatedAt: new Date(),
      })
      .where(eq(userInteractions.userId, userId));

    logger.info("Favorites cleared successfully");
    return { success: true };
  } catch (error) {
    logger.error("Failed to clear favorites", error);
    if (error instanceof Error) {
      logging.error("Failed to clear favorites", error);
    } else {
      logging.error("Failed to clear favorites", { message: String(error) });
    }
    return {
      success: false,
      error: "Failed to clear favorites",
    };
  }
}

/**
 * Check if an artwork is favorited by a user
 */
export async function checkIsFavorite(userId: string, artworkId: number):Promise<ApiResponse<ToggleFavorite>> {
  const logger = logging.child({
    action: "checkIsFavorite",
    userId,
    artworkId,
  });

  try {
    const favorite = await db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.artworkId, artworkId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .limit(1);

    const isFavorite = favorite.length > 0;
    logger.debug("Favorite status checked", { isFavorite });
    return { success: true, data: { isFavorite } };
  } catch (error) {
    logger.error("Failed to check favorite status", error);
    if (error instanceof Error) {
      logging.error("Failed to check favorite status", error);
    } else {
      logging.error("Failed to check favorite status", {
        message: String(error),
      });
    }
    return {
      success: false,
      error: "Failed to check favorite status",
      data: { isFavorite: false },
    };
  }
}
