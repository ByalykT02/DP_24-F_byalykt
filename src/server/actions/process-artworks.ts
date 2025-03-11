"use server";

import { fetchArtwork } from "./fetch-artwork";
import { upsertArtwork } from "./artwork-to-db";
import type { Artwork } from "~/lib/types/artwork";

export async function processArtworksToDb(artworks: Artwork[]) {
  try {
    const results = await Promise.allSettled(
      artworks.map(async (artwork) => {
        try {
          const artworkData = await fetchArtwork(String(artwork.contentId));

          const processedArtwork = await upsertArtwork(artworkData.data!);

          return processedArtwork;
        } catch (individualError) {
          console.error(
            `Error processing artwork ${artwork.contentId}:`,
            individualError,
          );
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

    console.log("Successful Results:", successfulResults.length);
    console.log("Failed Results:", failedResults.length);

    return {
      success: true,
      processed: successfulResults.length,
      total: artworks.length,
      errors: failedResults
        .map((result) => (result.status === "rejected" ? result.reason : null))
        .filter(Boolean),
    };
  } catch (error) {
    console.error("Error processing artworks:", error);
    return {
      success: false,
      error: "Failed to process artworks",
      processed: 0,
      total: artworks.length,
    };
  }
}
