"use server";

import { desc, eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { userInteractions, artworks, artists } from "~/server/db/schema";

export async function toggleFavorite(userId: string, artworkId: number) {
  try {
    // Check if the artwork is already favorited
    const existingFavorite = await db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.artworkId, artworkId),
        ),
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // If it exists, toggle the isFavorite status
      const newStatus = !existingFavorite[0]?.isFavorite;
      await db
        .update(userInteractions)
        .set({ isFavorite: newStatus })
        .where(eq(userInteractions.id, existingFavorite[0].id));

      return { success: true, isFavorite: newStatus };
    } else {
      // If it doesn't exist, create a new favorite
      await db.insert(userInteractions).values({
        userId,
        artworkId,
        isFavorite: true,
      });

      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}

export async function getFavorites(userId: string) {
  try {
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

    return favorites;
  } catch (error) {
    console.error("Failed to get favorites:", error);
    return [];
  }
}

export async function clearFavorites(userId: string) {
  try {
    await db
      .update(userInteractions)
      .set({ isFavorite: false })
      .where(eq(userInteractions.userId, userId));
    return { success: true };
  } catch (error) {
    console.error("Failed to clear favorites:", error);
    return { success: false, error: "Failed to clear favorites" };
  }
}

export async function checkIsFavorite(userId: string, artworkId: number) {
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

    return favorite.length > 0;
  } catch (error) {
    console.error("Failed to check favorite status:", error);
    return false;
  }
}
