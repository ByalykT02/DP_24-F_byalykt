"use server";

import { ApiResponse } from "~/lib/types/api";
import { Artwork, ArtworkDetailed } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";
import { fetchWikiArtApi } from "./fetch-api";
import { db } from "~/server/db";
import { artworks } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { processArtworksToDb } from "./process-artworks";

// Fallback artwork data
const FALLBACK_ARTWORK: ArtworkDetailed = {
  artistUrl: "alphonse-mucha",
  url: "holy-mount-athos-1926",
  dictionaries: [482, 494],
  location: null,
  period: null,
  serie: null,
  genre: "religious painting",
  material: null,
  style: "Symbolism",
  technique: null,
  auction: null,
  yearOfTrade: null,
  lastPrice: null,
  galleryName: "Mucha Museum, Prague, Czech Republic",
  tags: "priests-and-sacraments, Sky",
  description: null,
  title: "Holy Mount Athos",
  contentId: 227658,
  artistContentId: 227598,
  artistName: "Mucha Alphonse",
  completitionYear: 1926,
  yearAsString: "1926",
  width: "1983",
  height: "1689",
  image:
    "https://uploads7.wikiart.org/images/alphonse-mucha/holy-mount-athos-1926.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Process and normalize artwork data
 */
function processArtworkData(
  artwork: Partial<ArtworkDetailed>,
): ArtworkDetailed {
  if (!artwork || typeof artwork !== "object") {
    return FALLBACK_ARTWORK;
  }
    console.log(artwork.image)

  const width = artwork.width ? parseFloat(artwork.width) : null;
  const height = artwork.height ? parseFloat(artwork.height) : null;

  // Start with a new object to avoid mutations
  const processed: ArtworkDetailed = {
    // Set defaults for required fields
    contentId: artwork.contentId ?? FALLBACK_ARTWORK.contentId,
    artistContentId:
      artwork.artistContentId ?? FALLBACK_ARTWORK.artistContentId,
    artistName: artwork.artistName ?? FALLBACK_ARTWORK.artistName,
    artistUrl: artwork.artistUrl ?? FALLBACK_ARTWORK.artistUrl,
    title: artwork.title ?? FALLBACK_ARTWORK.title,
    image: artwork.image ?? FALLBACK_ARTWORK.image,

    // Copy all other fields with null fallbacks
    url: artwork.url ?? null,
    completitionYear: artwork.completitionYear
      ? Number(artwork.completitionYear)
      : null,
    yearAsString: artwork.yearAsString ?? null,
    genre: artwork.genre ?? null,
    style: artwork.style ?? null,
    tags: artwork.tags ?? null,
    dictionaries: Array.isArray(artwork.dictionaries)
      ? artwork.dictionaries
      : null,
    width: width,
    height: height,
    material: artwork.material ?? null,
    technique: artwork.technique ?? null,
    location: artwork.location ?? null,
    period: artwork.period ?? null,
    serie: artwork.serie ?? null,
    galleryName: artwork.galleryName ?? null,
    auction: artwork.auction ?? null,
    yearOfTrade: artwork.yearOfTrade ? Number(artwork.yearOfTrade) : null,
    lastPrice: artwork.lastPrice ? artwork.lastPrice : null,
    description: artwork.description ?? null,
    createdAt: artwork.createdAt ?? new Date(),
    updatedAt: artwork.updatedAt ?? new Date(),
  };

  // Clean up image URL by removing size suffixes
  if (processed.image) {
        console.log(processed.image);
    processed.image = processed.image.replace(
      /!(Large|Portrait|Square|PinterestSmall)\.jpg$/g,
      "",
    );
  }

  // Clean up description by removing Wiki markup
  if (processed.description) {
    processed.description = processed.description
      .replace(/\[.*?\]/g, "")
      .trim();
  }

  return processed;
}

/**
 * Fetch artwork by contentId with database caching
 */
export async function fetchArtwork(
  contentId: number | string,
): Promise<ApiResponse<ArtworkDetailed>> {
  const numericId =
    typeof contentId === "string" ? parseInt(contentId, 10) : contentId;

  const log = logger.child({
    action: "fetchArtwork",
    contentId: numericId,
  });

  // Validate input
  if (isNaN(numericId) || numericId <= 0) {
    log.warn("Invalid artwork contentId provided");
    return {
      success: false,
      error: "Invalid artwork ID",
      data: FALLBACK_ARTWORK,
    };
  }

  try {
    log.info("Fetching artwork details");

    // Check DB cache first
    const dbArtwork = await db
      .select()
      .from(artworks)
      .where(eq(artworks.contentId, numericId))
      .limit(1)
      .then((results) => results[0]);
    if (dbArtwork != undefined && !dbArtwork.image.includes("Large")) {
      log.info("Artwork found in database cache");
      return {
        success: true,
        data: dbArtwork as unknown as ArtworkDetailed,
      };
    }
    // Fetch from API if not in DB
    log.info("Artwork not found in cache, fetching from API");
    const apiArtwork = await fetchWikiArtApi<ArtworkDetailed>(
      `/App/Painting/ImageJson/${numericId}`,
    );

    if (!apiArtwork || !apiArtwork.contentId) {
      log.warn("Artwork not found in API");
      return {
        success: false,
        error: "Artwork not found",
        data: FALLBACK_ARTWORK,
      };
    }

    // Process the artwork data
    const processedArtwork = processArtworkData(apiArtwork);
    log.info("Artwork details fetched and processed successfully");

    // Store in DB for future use (don't await this to avoid slowing down response)
    try {
      db.insert(artworks)
        .values({
          ...processedArtwork,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [artworks.contentId],
          set: {
            ...processedArtwork,
            updatedAt: new Date(),
          },
        })
        .then(() => {
          log.debug("Artwork saved to database cache");
        })
        .catch((error) => {
          log.warn("Failed to cache artwork in database", {
            error: error instanceof Error ? error.message : String(error),
          });
        });
    } catch (dbError) {
      // Just log the error but don't fail the request
      log.warn("Error preparing artwork for database cache", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    return {
      success: true,
      data: processedArtwork,
    };
  } catch (error) {
    log.error("Failed to fetch artwork", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Failed to fetch artwork details",
      data: FALLBACK_ARTWORK,
    };
  }
}

/**
 * Search for artworks by title or artist
 */
export async function searchArtworks(
  query: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<ApiResponse<Artwork[]>> {
  const log = logger.child({
    action: "searchArtworks",
    query,
    page,
    pageSize,
  });

  if (!query || query.trim().length < 2) {
    return {
      success: false,
      error: "Search query too short",
      data: [],
    };
  }

  try {
    log.info("Searching for artworks");

    // Normalize pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(50, Math.max(1, pageSize));

    const searchResults = await fetchWikiArtApi<{ data: Artwork[] }>(
      `/en/App/Search/Art?term=${encodeURIComponent(query.trim())}&page=${validPage}&pageSize=${validPageSize}`,
    );

    if (!searchResults?.data || !Array.isArray(searchResults.data)) {
      log.info("No artworks found for query", { query });
      return {
        success: false,
        error: "No artworks found",
        data: [],
      };
    }

    // Process and save artworks to the database
    const processResults = await processArtworksToDb(searchResults.data);
    if (!processResults.success) {
      log.warn("Failed to process artworks during search", {
        errors: processResults.errors,
      });
    }

    // Process image URLs in results
    const processedResults = searchResults.data.map((artwork) => ({
      ...artwork,
      image:
        artwork.image?.replace(
          /!(Large|Portrait|Square|PinterestSmall)\.jpg$/g,
          "",
        ) || "",
    }));

    log.info("Artworks search completed", {
      resultCount: processedResults.length,
    });

    return {
      success: true,
      data: processedResults,
    };
  } catch (error) {
    log.error("Failed to search artworks", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Failed to search artworks",
      data: [],
    };
  }
}

/**
 * Fetch related artworks (by same artist, style, or period)
 */
export async function fetchRelatedArtworks(
  artworkId: number | string,
  limit: number = 8,
): Promise<ApiResponse<Artwork[]>> {
  const numericId =
    typeof artworkId === "string" ? parseInt(artworkId, 10) : artworkId;

  const log = logger.child({
    action: "fetchRelatedArtworks",
    artworkId: numericId,
    limit,
  });

  // Validate input
  if (isNaN(numericId) || numericId <= 0) {
    return {
      success: false,
      error: "Invalid artwork ID",
      data: [],
    };
  }

  try {
    // First fetch the artwork details to get artist and style
    const artworkDetails = await fetchArtwork(numericId);

    if (!artworkDetails.success || !artworkDetails.data) {
      return {
        success: false,
        error: "Source artwork not found",
        data: [],
      };
    }

    const { artistContentId, style, period } = artworkDetails.data;

    // Fetch artworks by the same artist
    const artistArtworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistId=${artistContentId}&json=2`,
    ).catch(() => []);

    if (
      !artistArtworks ||
      !Array.isArray(artistArtworks) ||
      artistArtworks.length === 0
    ) {
      log.warn("No related artworks found");
      return {
        success: false,
        error: "No related artworks found",
        data: [],
      };
    }

    // Process and save related artworks to the database
    const processResults = await processArtworksToDb(artistArtworks);
    if (!processResults.success) {
      log.warn("Failed to process related artworks", {
        errors: processResults.errors,
      });
    }

    // Filter out the current artwork and limit results
    const relatedArtworks = artistArtworks
      .filter((artwork) => artwork.contentId !== numericId)
      .map((artwork) => ({
        ...artwork,
        image:
          artwork.image?.replace(
            /!(Large|Portrait|Square|PinterestSmall)\.jpg$/g,
            "",
          ) || "",
      }))
      .slice(0, limit);

    log.info("Related artworks fetched", { count: relatedArtworks.length });

    return {
      success: true,
      data: relatedArtworks,
    };
  } catch (error) {
    log.error("Failed to fetch related artworks", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Failed to fetch related artworks",
      data: [],
    };
  }
}
