"use server";

import { Artist } from "~/lib/types/artist";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api";
import { artists } from "~/server/db/schema";
import { db } from "~/server/db";
import { sql, desc, asc } from "drizzle-orm";
import { logger } from "~/utils/logger";
import { ApiResponse } from "~/lib/types/api";

// Fallback data
const FALLBACK_ARTISTS: Artist[] = [
  {
    contentId: 227598,
    artistName: "Alphonse Mucha",
    url: "alphonse-mucha",
    lastNameFirst: "Mucha Alphonse",
    birthDayAsString: "July 24, 1860",
    deathDayAsString: "July 14, 1939",
    image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg!Portrait.jpg",
    wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
    dictonaries: [318, 7741],
  },
];

/**
 * Process artist data to clean up image URLs
 */
function processArtist(artist: Artist): Artist {
  return {
    ...artist,
    image: artist.image?.replace("!Portrait.jpg", "") || "",
  };
}

/**
 * Fetch popular artists with pagination support
 */
export async function fetchPopularArtists(
  page: number = 1,
  pageSize: number = 15
): Promise<{
  artists: Artist[];
  totalPages: number;
  currentPage: number;
}> {
  const log = logger.child({
    action: "fetchPopularArtists",
    page,
    pageSize,
  });

  try {
    // Validate pagination parameters
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    
    log.info("Fetching popular artists", { page, pageSize });

    // Combine count and data fetch into a single transaction for consistency
    const result = await db.transaction(async (tx) => {
      // Get total artist count
      const [totalCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(artists);

      const totalArtists = Number(totalCount?.count || 0);
      const totalPages = Math.ceil(totalArtists / pageSize);

      // Use original simple sorting by createdAt
      const paginatedArtists = await tx
        .select()
        .from(artists)
        .orderBy(artists.createdAt)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Process artists - clean up image URLs
      const processedArtists = paginatedArtists.map(processArtist);

      return {
        artists: processedArtists as Artist[],
        totalArtists,
        totalPages,
      };
    });

    log.info("Successfully fetched artists", { 
      artistCount: result.artists.length,
      totalArtists: result.totalArtists,
      totalPages: result.totalPages
    });

    return {
      artists: result.artists,
      totalPages: result.totalPages,
      currentPage: page,
    };
  } catch (error) {
    log.error("Failed to fetch popular artists", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      artists: FALLBACK_ARTISTS,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

/**
 * Search for artists by name
 */
export async function searchArtists(
  query: string
): Promise<ApiResponse<Artist[]>> {
  const log = logger.child({
    action: "searchArtists",
    query,
  });

  if (!query || query.length < 2) {
    return { success: false, error: "Search query too short" };
  }

  try {
    log.info("Searching for artists", { query });
    
    // First try to find artists in database
    const dbArtists = await db
      .select()
      .from(artists)
      .where(sql`artist_name ILIKE ${`%${query}%`}`)
      .limit(10);

    if (dbArtists.length > 0) {
      log.info("Found artists in database", { count: dbArtists.length });
      return {
        success: true,
        data: dbArtists.map(processArtist) as Artist[],
      };
    }

    // If no results in DB, try WikiArt API
    log.info("No results in database, querying WikiArt API");
    const apiResults = await fetchWikiArtApi<{ data: Artist[] }>(
      `/en/App/Search/Artists?term=${encodeURIComponent(query)}`
    );

    if (apiResults?.data && apiResults.data.length > 0) {
      const processedResults = apiResults.data.map(processArtist);
      log.info("Found artists via API", { count: processedResults.length });
      
      return {
        success: true,
        data: processedResults,
      };
    }

    log.info("No artists found for query", { query });
    return {
      success: false,
      error: "No artists found",
      data: [],
    };
  } catch (error) {
    log.error("Error searching for artists", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to search artists",
    };
  }
}

/**
 * Refresh the database with trending artists from WikiArt API
 * This can be used in an administrative context or scheduled job
 */
export async function refreshArtistDatabase(): Promise<ApiResponse<{ count: number }>> {
  const log = logger.child({ action: "refreshArtistDatabase" });
  
  try {
    log.info("Starting artist database refresh");
    
    // Fetch trending artists from WikiArt
    const apiArtists = await fetchWikiArtApi<Artist[]>("/en/App/Artists/Trending?json=2");
    
    if (!apiArtists || !Array.isArray(apiArtists) || apiArtists.length === 0) {
      log.warn("No artists returned from API");
      return {
        success: false,
        error: "No artists returned from API",
      };
    }
    
    log.info(`Retrieved ${apiArtists.length} trending artists from API`);
    
    // Process each artist and insert to DB
    const insertedCount = await db.transaction(async (tx) => {
      let count = 0;
      
      for (const artist of apiArtists) {
        if (!artist.contentId || !artist.artistName) continue;
        
        // Process the artist data
        const processedArtist = processArtist(artist);
        
        // Insert artist using onConflictDoUpdate for efficiency
        await tx
          .insert(artists)
          .values({
            ...processedArtist,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [artists.contentId],
            set: {
              ...processedArtist,
              updatedAt: new Date(),
            },
          });
        
        count++;
      }
      
      return count;
    });
    
    log.info("Artist database refresh completed", { insertedCount });
    
    return {
      success: true,
      data: { count: insertedCount },
    };
  } catch (error) {
    log.error("Failed to refresh artist database", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to refresh artist database",
    };
  }
}