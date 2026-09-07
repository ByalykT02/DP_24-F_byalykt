"use server";

import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "~/utils/logger";
import type { ArtworkDetailed } from "~/lib/types/artwork";
import { ArtistDetailed } from "~/lib/types/artist";
import { ApiResponse } from "~/lib/types/api";
import { fetchArtistDetails } from "../data_fetching/fetch-artist";
import {
  ARTIST_STALENESS_DAYS,
  isValidArtist,
  isValidArtwork,
} from "./artwork-to-db-utils";

export async function getArtistData(
  contentId: number,
  url: string | null,
): Promise<ArtistDetailed | null> {
  // Skip fetching if URL is missing
  if (!url) return null;
  
  try {
    // Check if artist exists and get last update time
    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, contentId),
    });
    
    // If artist exists and was updated recently (within staleness window), skip API call
    if (existingArtist?.updatedAt) {
      const stalenessCutoff = new Date();
      stalenessCutoff.setDate(stalenessCutoff.getDate() - ARTIST_STALENESS_DAYS);

      if (new Date(existingArtist.updatedAt) > stalenessCutoff) {
        return null; // Use existing data
      }
    }
    
    // Fetch fresh data from API
    const artistDetails = await fetchArtistDetails(url);
    return artistDetails?.artist;
  } catch (error) {
    logger.warn("Failed to get artist data from API", { 
      contentId, 
      url, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Ensures an artist exists in the database
 */
async function upsertArtist(
  artistContentId: number,
  artistName: string,
  artistUrl: string | null,
): Promise<ApiResponse<void>> {
  const log = logger.child({
    action: "upsertArtist",
    artistContentId,
    artistName,
  });

  // Validate artist data
  if (!isValidArtist({ contentId: artistContentId, artistName, artistUrl })) {
    log.warn("Invalid artist data", { artistContentId, artistName });
    return {
      success: false,
      error: "Invalid artist data",
    };
  }

  try {
    // Try to get fresh artist data if needed
    const artistData = await getArtistData(artistContentId, artistUrl);
    
    if (artistData) {
      // If we have fresh data, use it for upsert. The `url` column is
      // non-nullable, so fall back to "" (same as minimal records below).
      const artistValues = {
        ...artistData,
        url: artistData.url ?? "",
        updatedAt: new Date(),
      };
      await db.insert(artists)
        .values(artistValues)
        .onConflictDoUpdate({
          target: [artists.contentId],
          set: artistValues,
        });
      
      log.info("Artist updated with fresh data", { artistContentId });
    } else {
      // Check if artist exists at all
      const existingArtist = await db.query.artists.findFirst({
        where: eq(artists.contentId, artistContentId),
      });
      
      // If no existing artist and no fresh data, create minimal record
      if (!existingArtist) {
        await db.insert(artists)
          .values({
            contentId: artistContentId,
            artistName,
            url: artistUrl || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
          
        log.info("Created minimal artist record", { artistContentId });
      }
    }

    return { success: true };
  } catch (error) {
    log.error("Failed to upsert artist", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to update artist record",
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
  const log = logger.child({
    action: "upsertArtwork",
    artworkId: artwork.contentId,
    title: artwork.title,
  });

  // Validate artwork data
  if (!isValidArtwork(artwork)) {
    log.warn("Invalid artwork data", {
      artworkId: artwork.contentId,
      title: artwork.title,
    });
    return {
      success: false,
      error: "Invalid artwork data",
    };
  }

  try {
    // Use transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Step 1: Ensure artist exists
      const artistResult = await upsertArtist(
        artwork.artistContentId,
        artwork.artistName,
        artwork.artistUrl
      );

      if (!artistResult.success) {
        log.warn("Artist upsert failed", { error: artistResult.error });
        return {
          success: false,
          error: artistResult.error || "Failed to ensure artist exists",
        };
      }

      // Step 2: Clean/normalize artwork data
      const normalizedArtwork = {
        ...artwork,
        // Ensure URL consistency by removing Large.jpg suffix if present
        image: artwork.image.replace('!Large.jpg', ''),
        // Ensure dates are set
        updatedAt: new Date()
      };

      // Step 3: Upsert artwork
      await tx.insert(artworks)
        .values({
          ...normalizedArtwork,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [artworks.contentId],
          set: normalizedArtwork,
        });

      log.info("Artwork upserted successfully", {
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
    });
  } catch (error) {
    log.error("Artwork upsert failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to ensure artwork exists",
    };
  }
}