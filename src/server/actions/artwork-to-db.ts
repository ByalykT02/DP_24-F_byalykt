"use server";

import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { logger, logging } from "~/utils/logger";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { ApiResponse } from "~/lib/types/collection";
import { fetchArtistDetails } from "./fetch-artist";

/**
 * Checks if the artist data is valid
 */
function isValidArtist(data: {
  contentId: number;
  artistName: string;
  artistUrl: string | null;
}): boolean {
  if (!data.contentId || data.contentId <= 0) return false;
  if (!data.artistName || data.artistName.trim().length === 0) return false;
  return true;
}

/**
 * Checks if the artwork data is valid
 */
function isValidArtwork(data: ArtworkDetailed): boolean {
  if (!data.contentId || data.contentId <= 0) return false;
  if (!data.artistContentId || data.artistContentId <= 0) return false;
  if (!data.title || data.title.trim().length === 0) return false;
  if (!data.image || data.image.trim().length === 0) return false;
  return true;
}

/**
 * Ensures an artist exists in the database
 */
async function upsertArtist(
  artistContentId: number,
  artistName: string,
  artistUrl: string | null,
): Promise<ApiResponse<void>> {
  const logger = logging.child({
    action: "upsertArtist",
    artistContentId,
    artistName,
  });

  // Validate artist data
  if (!isValidArtist({ contentId: artistContentId, artistName, artistUrl })) {
    logger.warn("Artist data validation failed", {
      artistContentId,
      artistName,
    });
    return {
      success: false,
      error: "Invalid artist data",
    };
  }

  logger.info("Starting upsert process for artist", {
    artistContentId,
    artistName,
    artistUrl,
  });

  try {
    const detailedArtist = await fetchArtistDetails(artistUrl!);

    if (!detailedArtist) {
      logger.warn("Artist details could not be fetched", { artistUrl });
    } else {
      logger.info("Artist details successfully fetched from API", {
        artistUrl,
      });
    }

    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, artistContentId),
    });

    if (!existingArtist) {
      logger.info("No existing artist found. Creating a new record.");
      await db
        .insert(artists)
        .values(detailedArtist.artist)
        .onConflictDoNothing();

      logger.info("New artist record created successfully.");
    } else {
      logger.info("Artist already exists. Updating the record.", {
        existingArtistId: existingArtist.contentId,
      });

      await db
        .update(artists)
        .set(detailedArtist.artist)
        .where(eq(artists.contentId, artistContentId));

      logger.info("Artist record updated successfully.");
    }

    return { success: true };
  } catch (error) {
    logger.error("An error occurred during the artist upsert process", {
      error,
      artistContentId,
      artistName,
    });
    return {
      success: false,
      error: "Unexpected error occurred",
    };
  }
}

/**
 * Ensures an artwork exists in the database
 * Creates or updates both the artwork and associated artist
 */
export async function upsertArtwork(
  artwork: ArtworkDetailed,
): Promise<ApiResponse<{ artworkId: number; title: string }>> {
  const logger = logging.child({
    action: "upsertArtwork",
    artworkId: artwork.contentId,
  });

  // Validate artwork data
  if (!isValidArtwork(artwork)) {
    logger.warn("Artwork data validation failed", {
      artworkId: artwork.contentId,
      title: artwork.title,
    });
    return {
      success: false,
      error: "Invalid artwork data",
    };
  }

  logger.info("Starting upsert process for artwork", { title: artwork.title });

  try {
    // Ensure artist exists first
    const artistResult = await upsertArtist(
      artwork.artistContentId,
      artwork.artistName,
      artwork.artistUrl,
    );

    if (!artistResult.success) {
      logger.error("Failed to upsert artist for the artwork", {
        artistContentId: artwork.artistContentId,
        artistName: artwork.artistName,
      });
      return {
        success: false,
        error: artistResult.error,
      };
    }

    logger.info("Artist successfully ensured. Proceeding with artwork upsert.");

    await db
      .insert(artworks)
      .values({ ...artwork, createdAt: new Date() })
      .onConflictDoUpdate({
        target: [artworks.contentId],
        set: artwork,
      });

    logger.info("Artwork upserted successfully", {
      artworkId: artwork.contentId,
      title: artwork.title,
    });

    return {
      success: true,
      data: {
        artworkId: artwork.contentId,
        title: artwork.title,
      },
    };
  } catch (error) {
    logger.error("An error occurred during the artwork upsert process", {
      error,
      artworkId: artwork.contentId,
      title: artwork.title,
    });
    return {
      success: false,
      error: "Failed to ensure artwork exists",
    };
  }
}
