"use server";

import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { logger, logging } from "~/utils/logger";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { ApiResponse } from "~/lib/types/collection";

/**
 * Validates artist data
 */
function validateArtist(data: {
  contentId: number;
  artistName: string;
  artistUrl: string | null;
}): boolean {
  if (!data.contentId || data.contentId <= 0) return false;
  if (!data.artistName || data.artistName.trim().length === 0) return false;
  return true;
}

/**
 * Validates artwork data
 */
function validateArtwork(data: ArtworkDetailed): boolean {
  if (!data.contentId || data.contentId <= 0) return false;
  if (!data.artistContentId || data.artistContentId <= 0) return false;
  if (!data.title || data.title.trim().length === 0) return false;
  if (!data.image || data.image.trim().length === 0) return false;
  return true;
}

/**
 * Ensures an artist exists in the database
 */
async function ensureArtistExists(
  artistContentId: number,
  artistName: string,
  artistUrl: string | null,
): Promise<ApiResponse<void>> {
  const logger = logging.child({
    action: "ensureArtistExists",
    artistContentId,
    artistName,
  });

  try {
    // Validate artist data
    if (
      !validateArtist({ contentId: artistContentId, artistName, artistUrl })
    ) {
      logger.warn("Invalid artist data", { artistContentId, artistName });
      return {
        success: false,
        error: "Invalid artist data",
      };
    }

    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, artistContentId),
    });

    if (!existingArtist) {
      logger.info("Creating new artist record");
      await db
        .insert(artists)
        .values({
          contentId: artistContentId,
          artistName: artistName,
          url: artistUrl,
        })
        .onConflictDoNothing();

      logger.info("Artist created successfully");
    } else {
      logger.debug("Artist already exists", {
        artistId: existingArtist.contentId,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to ensure artist exists", error);
    return {
      success: false,
      error: "Failed to ensure artist exists",
    };
  }
}

/**
 * Ensures an artwork exists in the database
 * Creates or updates both the artwork and associated artist
 */
export async function ensureArtworkExists(
  artwork: ArtworkDetailed,
): Promise<ApiResponse<{ artworkId: number; title: string }>> {
  const logger = logging.child({
    action: "ensureArtworkExists",
    artworkId: artwork.contentId,
  });

  try {
    // Validate artwork data
    if (!validateArtwork(artwork)) {
      logger.warn("Invalid artwork data", {
        artworkId: artwork.contentId,
        title: artwork.title,
      });
      return {
        success: false,
        error: "Invalid artwork data",
      };
    }

    logger.info("Ensuring artwork exists", { title: artwork.title });

    // Ensure artist exists first
    const artistResult = await ensureArtistExists(
      artwork.artistContentId,
      artwork.artistName,
      artwork.artistUrl,
    );

    if (!artistResult.success) {
      return {
        success: false,
        error: artistResult.error,
      };
    }

    // Pr
    

    const existingArtwork = await db.query.artworks.findFirst({
      where: eq(artworks.contentId, artwork.contentId),
    });

    if (!existingArtwork) {
      logger.info("Creating new artwork record");
      await db
        .insert(artworks)
        .values({
          ...artwork,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [artworks.contentId],
          set: artwork,
        });

      logger.info("Artwork created successfully");
    } else {
      logger.info("Updating existing artwork");
      await db
        .update(artworks)
        .set(artwork)
        .where(eq(artworks.contentId, artwork.contentId));

      logger.info("Artwork updated successfully");
    }

    return {
      success: true,
      data: {
        artworkId: artwork.contentId,
        title: artwork.title,
      },
    };
  } catch (error) {
    logger.error("Failed to ensure artwork exists", error);
    return {
      success: false,
      error: "Failed to ensure artwork exists",
    };
  }
}
