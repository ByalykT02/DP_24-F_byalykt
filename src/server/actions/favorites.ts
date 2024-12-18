"use server";

import { desc, eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { userInteractions, artworks, artists } from "~/server/db/schema";
import { logging } from "~/utils/logger";
import { z } from "zod"; // For input validation

// Input validation schemas
const toggleFavoriteSchema = z.object({
  userId: z.string().min(1),
  artworkId: z.number().positive(),
});

const getFavoritesSchema = z.object({
  userId: z.string().min(1),
});

/**
 * Toggle favorite status for an artwork
 */
export async function toggleFavorite(userId: string, artworkId: number) {
  const logger = logging.child({ 
    action: 'toggleFavorite', 
    userId, 
    artworkId 
  });

  try {
    // Validate inputs
    const validated = toggleFavoriteSchema.parse({ userId, artworkId });

    // Check if the artwork is already favorited
    const existingFavorite = await db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, validated.userId),
          eq(userInteractions.artworkId, validated.artworkId),
        ),
      )
      .limit(1);

    let result;
    if (existingFavorite.length > 0) {
      const newStatus = !existingFavorite[0]?.isFavorite;
      await db
        .update(userInteractions)
        .set({ 
          isFavorite: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(userInteractions.id, existingFavorite[0].id));
      
      result = { success: true, isFavorite: newStatus };
      logger.info('Favorite status updated successfully', result);
    } else {
      await db.insert(userInteractions).values({
        userId: validated.userId,
        artworkId: validated.artworkId,
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      result = { success: true, isFavorite: true };
      logger.info('New favorite created successfully', result);
    }

    return result;

  } catch (error) {
    logger.error('Failed to toggle favorite', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: 'Failed to toggle favorite status'
    };
  }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(userId: string) {
  const logger = logging.child({ 
    action: 'getFavorites', 
    userId 
  });

  try {
    // Validate input
    const validated = getFavoritesSchema.parse({ userId });

    const favorites = await db
      .select({
        id: userInteractions.id,
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
        createdAt: userInteractions.createdAt,
      })
      .from(userInteractions)
      .innerJoin(artworks, eq(userInteractions.artworkId, artworks.contentId))
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(
        and(
          eq(userInteractions.userId, validated.userId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .orderBy(desc(userInteractions.createdAt));

    logger.info(`Retrieved ${favorites.length} favorites`);
    return { success: true, data: favorites };

  } catch (error) {
    logger.error('Failed to get favorites', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: 'Failed to retrieve favorites',
      data: [] 
    };
  }
}

/**
 * Clear all favorites for a user
 */
export async function clearFavorites(userId: string) {
  const logger = logging.child({ 
    action: 'clearFavorites', 
    userId 
  });

  try {
    // Validate input
    const validated = getFavoritesSchema.parse({ userId });

    await db
      .update(userInteractions)
      .set({ 
        isFavorite: false,
        updatedAt: new Date(),
      })
      .where(eq(userInteractions.userId, validated.userId));

    logger.info('Favorites cleared successfully');
    return { success: true };

  } catch (error) {
    logger.error('Failed to clear favorites', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: 'Failed to clear favorites' 
    };
  }
}

/**
 * Check if an artwork is favorited by a user
 */
export async function checkIsFavorite(userId: string, artworkId: number) {
  const logger = logging.child({ 
    action: 'checkIsFavorite', 
    userId,
    artworkId 
  });

  try {
    // Validate inputs
    const validated = toggleFavoriteSchema.parse({ userId, artworkId });

    const favorite = await db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, validated.userId),
          eq(userInteractions.artworkId, validated.artworkId),
          eq(userInteractions.isFavorite, true),
        ),
      )
      .limit(1);

    const isFavorite = favorite.length > 0;
    logger.debug('Favorite status checked', { isFavorite });
    return { success: true, isFavorite };

  } catch (error) {
    logger.error('Failed to check favorite status', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: 'Failed to check favorite status',
      isFavorite: false 
    };
  }
}