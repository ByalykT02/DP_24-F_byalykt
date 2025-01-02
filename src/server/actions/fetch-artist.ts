"use server";

import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";

// Constants
const MAX_ARTWORKS = 12;

// Fallback data
const FALLBACK_ARTIST: ArtistDetailed = {
  // Basic Info
  contentId: 227598,
  artistName: "Alphonse Mucha",
  url: "alphonse-mucha",
  lastNameFirst: "Mucha Alphonse",

  // Dates
  birthDay: "/Date(-3471292800000)/",
  deathDay: "/Date(-961776000000)/",
  birthDayAsString: "July 24, 1860",
  deathDayAsString: "July 14, 1939",

  // Additional Info
  originalArtistName: "Alfons Maria Mucha",
  gender: "male",
  biography:
    "Alphonse Mucha was a Czech painter, illustrator and graphic artist, living in Paris during the Art Nouveau period.",
  story: "http://en.wikipedia.org/wiki/Alphonse_Mucha",

  // Career Details
  activeYearsStart: null,
  activeYearsCompletion: null,
  series: "The Seasons\nSlav Epic\nDocuments Decoratifs",
  themes: "Art Nouveau, Decorative Art",
  periodsOfWork:
    "Paris Period (1887-1904)\nAmerican Period (1904-1910)\nCzech Period (1910-1939)",

  // Media
  image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg",
  wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",

  // Relations
  relatedArtistsIds: [],
  dictonaries: [318, 7741],
};

function convertJsonDate(jsonDate: string): Date {
  const match = jsonDate.match(/\/Date\((-?\d+)\)\//);
  if (!match) {
    throw new Error(`Invalid JSON date format: ${jsonDate}`);
  }
  return new Date(parseInt(match[1]!, 10));
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const log = logger.child({
    action: "fetchApi",
    endpoint,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    log.info("Starting API request");

    const response = await fetch(`https://www.wikiart.org/en/${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      log.error("API request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    log.info("API request successful");
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      log.error("Request timeout", { endpoint });
      throw new Error(`Request timeout for ${endpoint}`);
    }
    log.error("API request failed", { error });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function processArtist(artist: ArtistDetailed): ArtistDetailed {
  const log = logger.child({
    action: "processArtist",
    artistId: artist?.contentId,
  });

  if (!artist) {
    log.error("Artist data missing");
    throw new Error("Artist data not found");
  }

  log.info("Processing artist data");
  return {
    ...artist,
    image: artist.image || FALLBACK_ARTIST.image,
    birthDay: convertJsonDate(artist.birthDay).toISOString(),
    deathDay: convertJsonDate(artist.deathDay).toISOString(),
  };
}

function processArtworks(artworks: Artwork[]): Artwork[] {
  const log = logger.child({
    action: "processArtworks",
    artworkCount: artworks.length,
  });

  log.info("Processing artworks");
  return artworks.map((artwork) => ({
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  }));
}

export async function fetchArtistDetails(url: string) {
  const log = logger.child({
    action: "fetchArtistDetails",
    artistUrl: url,
  });

  try {
    log.info("Fetching artist details");

    const artist = await fetchApi<ArtistDetailed>(`/${url}?json=2`);
    if (!artist) {
      log.error("Artist data not found");
      throw new Error("Artist data not found");
    }
    log.info("Artist details fetched", { artistId: artist.contentId });

    const artworks = await fetchApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${url}&json=2`,
    );
    log.info("Artworks fetched", { count: artworks.length });

    const processedData = {
      artist: processArtist(artist),
      artworks: processArtworks(artworks),
    };

    log.info("Artist details processed successfully", {
      artistId: artist.contentId,
      artworksCount: artworks.length,
    });

    return processedData;
  } catch (error) {
    log.error("Failed to fetch artist details", { error });
    throw error;
  }
}
