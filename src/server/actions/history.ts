"use server";

import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { viewingHistory, artworks, artists } from "~/server/db/schema";
import { ensureArtworkExists } from "./artwork-to-db";
import { ArtworkDetailed } from "~/lib/types/artwork";

export async function addToHistory(userId: string, artwork: ArtworkDetailed) {
  try {
    // First ensure the artwork exists in our database
    const success = await ensureArtworkExists(artwork);
    if (!success) {
      throw new Error("Failed to ensure artwork exists");
    }

    await db.insert(viewingHistory).values({
      userId,
      artworkId: artwork.contentId,
    });
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

    // If no recent view exists, add new entry
    if (recentView.length === 0) {
      await db.insert(viewingHistory).values({
        userId,
        artworkId: artwork.contentId,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to add to history:", error);
    return { success: false, error: "Failed to add to history" };
  }
}

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

export async function clearHistory(userId: string) {
  try {
    await db.delete(viewingHistory).where(eq(viewingHistory.userId, userId));
    return { success: true };
  } catch (error) {
    console.error("Failed to clear history:", error);
    return { success: false, error: "Failed to clear history" };
  }
}
