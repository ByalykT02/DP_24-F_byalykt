"use server";

import { Artist } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api";
import { logger } from "~/utils/logger";
import {
  FALLBACK_DATA,
  MAX_ARTWORKS,
  processHomeArtwork,
  shuffleArray,
} from "~/lib/data/home-feed-utils";

/**
 * Fetches a random artist from the WikiArt popular artists list
 * @returns {Promise<Artist>} Promise resolving to an Artist object
 */
async function getRandomArtist(): Promise<Artist> {
  const log = logger.child({ action: "getRandomArtist" });
  try {
    const artists = await fetchWikiArtApi<Artist[]>(
      "/app/api/popularartists?json=1",
    );

    if (!artists || artists.length === 0) {
      log.warn("No artists returned from API, using fallback data");
      return FALLBACK_DATA.artist;
    }

    const randomIndex = Math.floor(Math.random() * artists.length);
    const selectedArtist = artists[randomIndex];

    // Verify that we have a valid artist object
    if (!selectedArtist) {
      log.warn("Selected artist is undefined, using fallback data");
      return FALLBACK_DATA.artist;
    }

    log.info("Successfully fetched artist", {
      artistName: selectedArtist.artistName,
      url: selectedArtist.url,
    });
    return selectedArtist;
  } catch (error) {
    log.error("Error fetching random artist", {
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_DATA.artist;
  }
}

/**
 * Processes artwork image URLs to ensure consistent format
 * @param {Artwork} artwork - Artwork object to process
 * @returns {Artwork} Processed artwork with normalized image URL
 */
/**
 * Fetches a collection of random artworks from a randomly selected artist
 * @returns {Promise<Artwork[]>} Promise resolving to an array of Artwork objects
 */
export async function fetchArtworks(): Promise<Artwork[]> {
  const log = logger.child({ action: "fetchArtworks" });
  try {
    const artist = await getRandomArtist();

    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artist.url}&json=2`,
    );

    if (!artworks || artworks.length === 0) {
      log.warn("No artworks found for artist, using fallback data", {
        artistName: artist.artistName,
      });
      return FALLBACK_DATA.artworks;
    }

    // Ensure we have a diverse selection by shuffling and limit to maximum count
    const processedArtworks = shuffleArray(artworks)
      .slice(0, MAX_ARTWORKS)
      .map(processHomeArtwork);

    log.info("Successfully fetched artworks", {
      count: processedArtworks.length,
      artistName: artist.artistName,
    });

    return processedArtworks;
  } catch (error) {
    log.error("Error fetching artworks collection", {
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_DATA.artworks;
  }
}

/**
 * Fetches artworks from a specific artist by URL
 * @param {string} artistUrl - The URL identifier of the artist
 * @param {number} [limit=MAX_ARTWORKS] - Maximum number of artworks to return
 * @returns {Promise<Artwork[]>} Promise resolving to an array of Artwork objects
 */
export async function fetchArtworksByArtist(
  artistUrl: string,
  limit: number = MAX_ARTWORKS
): Promise<Artwork[]> {
  const log = logger.child({ action: "fetchArtworksByArtist", artistUrl });
  try {
    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artistUrl}&json=2`,
    );

    if (!artworks || artworks.length === 0) {
      log.warn("No artworks found for artist URL, using fallback data", {
        artistUrl,
      });
      return FALLBACK_DATA.artworks;
    }

    // Process and limit the number of returned artworks
    const processedArtworks = artworks
      .slice(0, limit)
      .map(processHomeArtwork);

    log.info("Successfully fetched artworks for artist", {
      count: processedArtworks.length,
      artistUrl,
    });

    return processedArtworks;
  } catch (error) {
    log.error("Error fetching artworks for artist", {
      artistUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_DATA.artworks;
  }
}

/**
 * Fetches featured artworks for the home page with custom selection criteria
 * @param {number} [count=MAX_ARTWORKS] - Number of artworks to return
 * @returns {Promise<Artwork[]>} Promise resolving to an array of featured Artwork objects
 */
export async function fetchFeaturedArtworks(count: number = MAX_ARTWORKS): Promise<Artwork[]> {
  const log = logger.child({ action: "fetchFeaturedArtworks" });
  try {
    // Fetch from most popular paintings
    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/MostViewedPaintings?json=2`,
    );

    if (!artworks || artworks.length === 0) {
      log.warn("No popular artworks found, using fallback data");
      return FALLBACK_DATA.artworks;
    }

    // Process, shuffle for variety, and limit the number of returned artworks
    const processedArtworks = shuffleArray(artworks)
      .slice(0, count)
      .map(processHomeArtwork);

    log.info("Successfully fetched featured artworks", {
      count: processedArtworks.length,
    });

    return processedArtworks;
  } catch (error) {
    log.error("Error fetching featured artworks", {
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_DATA.artworks;
  }
}