"use server";

import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork, ArtworkDetailed } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";
import { fetchWikiArtApi } from "./fetch-api";

// Fallback data
const FALLBACK_ARTIST: ArtistDetailed = {
  contentId: 227598,
  artistName: "Alphonse Mucha",
  url: "alphonse-mucha",
  lastNameFirst: "Mucha Alphonse",
  birthDay: "/Date(-3453580800000)/",
  deathDay: "/Date(-961545600000)/",
  birthDayAsString: "July 24, 1860",
  deathDayAsString: "July 14, 1939",
  originalArtistName: "Alfons Maria Mucha",
  gender: "male",
  biography: " ",
  story: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  activeYearsStart: "1868",
  activeYearsCompletion: "1938",
  series: "Slav Epic\r\nThe seasons\r\nArt Posters\r\nThe Times of the Day",
  themes: "",
  periodsOfWork: "",
  image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg!Portrait.jpg",
  wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  relatedArtistsIds: [],
  dictonaries: [318, 7741],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FALLBACK_ARTWORKS: Artwork[] = [
  {
    title: "Holy Mount Athos",
    contentId: 227658,
    artistContentId: 227598,
    artistName: "Mucha Alphonse",
    completitionYear: 1926,
    yearAsString: "1926",
    width: 1983,
    height: 1689,
    image:
      "https://uploads7.wikiart.org/images/alphonse-mucha/holy-mount-athos-1926.jpg",
  },
];

/**
 * Safely converts WikiArt JSON date format to a Date object
 * Returns null if conversion fails
 */
function convertJsonDate(jsonDate: string): string | null {
  try {
    const match = jsonDate.match(/\/Date\((-?\d+)\)\//);
    if (!match || !match[1]) {
      return null;
    }
    
    const timestamp = parseInt(match[1], 10);
    if (isNaN(timestamp)) {
      return null;
    }
    
    return new Date(timestamp).toISOString();
  } catch (error) {
    logger.warn("Failed to convert date", { jsonDate, error });
    return null;
  }
}

/**
 * Process and normalize artist data
 * Uses fallback only if artist data is completely missing
 */
function processArtist(artist: ArtistDetailed | null): ArtistDetailed {
  const log = logger.child({
    action: "processArtist",
    artistId: artist?.contentId ?? "unknown",
  });

  if (!artist) {
    log.warn("Artist data missing, using fallback");
    return {
      ...FALLBACK_ARTIST,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  log.info("Processing artist data");
  
  // Process only the actual artist data - don't mix with fallback
  const processedArtist = { ...artist };
  
  // Process dates if they exist
  if (processedArtist.birthDay) {
    const birthDay = convertJsonDate(processedArtist.birthDay);
    if (birthDay) processedArtist.birthDay = birthDay;
  }
  
  if (processedArtist.deathDay) {
    const deathDay = convertJsonDate(processedArtist.deathDay);
    if (deathDay) processedArtist.deathDay = deathDay;
  }
  
  // Ensure image exists - use artist's own image or null, not fallback
  processedArtist.image = processedArtist.image || null;
  
  // Set timestamps for database compatibility
  processedArtist.createdAt = new Date();
  processedArtist.updatedAt = new Date();
  
  return processedArtist;
}

/**
 * Process and normalize artwork data
 */
function processArtworks(artworks: Artwork[] | null): Artwork[] {
  const log = logger.child({
    action: "processArtworks",
    artworkCount: artworks?.length ?? 0,
  });

  if (!Array.isArray(artworks) || artworks.length === 0) {
    log.warn("No artworks found, using fallback");
    return [...FALLBACK_ARTWORKS]; // Return a copy of fallback
  }

  log.info("Processing artworks");
  
  return artworks
    .filter(artwork => artwork && artwork.contentId && artwork.image)
    .map(artwork => ({
      ...artwork,
      image: artwork.image.replace("!Large.jpg", ""),
    }));
}

/**
 * Fetch artist details and artworks in parallel
 */
export async function fetchArtistDetails(url: string) {
  if (!url) {
    logger.warn("Invalid artist URL provided");
    return {
      artist: { ...FALLBACK_ARTIST },
      artworks: [...FALLBACK_ARTWORKS],
    };
  }

  // Normalize URL for consistency
  const normalizedUrl = url.toLowerCase().trim();
  
  const log = logger.child({
    action: "fetchArtistDetails",
    artistUrl: normalizedUrl,
  });

  try {
    log.info("Fetching artist details");

    // Fetch artist and artworks in parallel for better performance
    const [artistResponse, artworksResponse] = await Promise.all([
      fetchWikiArtApi<ArtistDetailed>(`/${normalizedUrl}?json=2`)
        .catch(error => {
          log.error("Failed to fetch artist data", { 
            error: error instanceof Error ? error.message : String(error)
          });
          return null;
        }),
        
      fetchWikiArtApi<Artwork[]>(
        `/App/Painting/PaintingsByArtist?artistUrl=${normalizedUrl}&json=2`
      ).catch(error => {
        log.error("Failed to fetch artist's artworks", { 
          error: error instanceof Error ? error.message : String(error) 
        });
        return null;
      })
    ]);

    // Handle the case when artist isn't found
    if (!artistResponse) {
      log.warn("Artist not found, using fallback data");
      return {
        artist: processArtist(FALLBACK_ARTIST),
        artworks: processArtworks(FALLBACK_ARTWORKS),
      };
    }

    // Process real artist data
    const processedArtist = processArtist(artistResponse);
    log.info("Artist details fetched and processed", { 
      artistId: processedArtist.contentId,
      name: processedArtist.artistName 
    });

    // Process artworks or use fallbacks if none found
    const processedArtworks = artworksResponse?.length 
      ? processArtworks(artworksResponse)
      : processArtworks(FALLBACK_ARTWORKS);
    
    log.info("Artworks processed", { count: processedArtworks.length });

    return {
      artist: processedArtist,
      artworks: processedArtworks,
    };
  } catch (error) {
    log.error("Failed to fetch artist details", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return fallback data on error
    return {
      artist: processArtist(FALLBACK_ARTIST),
      artworks: processArtworks(FALLBACK_ARTWORKS),
    };
  }
}