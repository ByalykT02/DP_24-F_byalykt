"use server";

import { fetchArtwork } from "../data_fetching/fetch-artwork";
import { upsertArtwork } from "~/server/actions/content/artwork-to-db";
import { logger } from "~/utils/logger";
import type { Artwork } from "~/lib/types/artwork";

export async function processArtworksToDb(artworks: Artwork[]) {
  const log = logger.child({ action: "processArtworksToDb" });
  try {
    const results = await Promise.allSettled(
      artworks.map(async (artwork) => {
        try {
          const artworkData = await fetchArtwork(String(artwork.contentId));

          if (!artworkData.success || !artworkData.data) {
            throw new Error(
              artworkData.error ?? `Missing artwork data for ${artwork.contentId}`,
            );
          }

          const processedArtwork = await upsertArtwork(artworkData.data);

          return processedArtwork;
        } catch (individualError) {
          log.warn(`Error processing artwork ${artwork.contentId}`, {
            error:
              individualError instanceof Error
                ? individualError.message
                : String(individualError),
          });
          throw individualError; // Rethrow to ensure it's counted as rejected
        }
      }),
    );

    const successfulResults = results.filter(
      (result) => result.status === "fulfilled",
    );
    const failedResults = results.filter(
      (result) => result.status === "rejected",
    );

    log.info("Artwork ingestion batch completed", {
      successful: successfulResults.length,
      failed: failedResults.length,
      total: artworks.length,
    });

    return {
      success: true,
      processed: successfulResults.length,
      total: artworks.length,
      errors: failedResults
        .map((result) => (result.status === "rejected" ? result.reason : null))
        .filter(Boolean),
    };
  } catch (error) {
    log.error("Error processing artworks", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Failed to process artworks",
      processed: 0,
      total: artworks.length,
    };
  }
}
