"use server";

import { Artwork } from "~/lib/types/artwork";
import { db } from "~/server/db";
import { artworks } from "~/server/db/schema";
import { asc, desc, sql } from "drizzle-orm";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api";

/**
 * Fallback artwork data in case of API or database failures
 */
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
 * Pagination result interface for artwork collections
 */
interface PaginatedArtworkResult {
  artworks: Artwork[];
  totalPages: number;
  currentPage: number;
}

/**
 * Processes artwork images to ensure correct URL format
 * @param artwork - The artwork object to process
 * @returns The processed artwork with corrected image URL
 */
function processArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  };
}

/**
 * Fetches random artworks from the WikiArt API
 * @deprecated Use fetchArtworksFromDB instead
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated artworks with total pages and current page
 */
export async function fetchRandomArtworks(
  page: number = 1,
  pageSize: number = 15,
): Promise<PaginatedArtworkResult> {
  try {
    const randomSeed = Math.floor(Math.random() * 1000);

    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/MostViewedPaintings?randomSeed=${randomSeed}&json=2`,
    );

    const totalPages = Math.ceil(artworks.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedArtworks = artworks
      .slice(startIndex, startIndex + pageSize)
      .map(processArtwork);

    return {
      artworks: paginatedArtworks,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching random artworks from API:", error);
    return { artworks: FALLBACK_ARTWORKS, totalPages: 1, currentPage: 1 };
  }
}

/**
 * Fetches artworks from the database with pagination
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated artworks with total pages and current page
 */
export async function fetchArtworksFromDB(
  page: number = 1,
  pageSize: number = 15,
): Promise<{
  artworks: Artwork[];
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  total: number;
}> {
  try {
    // Validate pagination parameters
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artworks);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated results
    const dbArtworks = await db
      .select()
      .from(artworks)
      .orderBy(asc(artworks.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform database results to Artwork type
    const processedArtworks = dbArtworks.map((artwork) => ({
      title: artwork.title,
      contentId: artwork.contentId,
      artistContentId: artwork.artistContentId,
      artistName: artwork.artistName,
      completitionYear: artwork.completitionYear ?? undefined,
      yearAsString: artwork.yearAsString ?? undefined,
      width: Number(artwork.width) ?? undefined,
      height: Number(artwork.height) ?? undefined,
      image: artwork.image,
    })).map(processArtwork);

    const hasMore = page < totalPages;

    return {
      artworks: processedArtworks,
      totalPages,
      currentPage: page,
      hasMore,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error fetching artworks for infinite scroll:", error);
    return {
      artworks: FALLBACK_ARTWORKS,
      totalPages: 1,
      currentPage: 1,
      hasMore: false,
      total: FALLBACK_ARTWORKS.length,
    };
  }
}

/**
 * Valid columns for sorting in the artworks table
 */
type SortableColumn = 'title' | 'artistName' | 'completitionYear' | 'createdAt' | 'updatedAt';

/**
 * Fetches artworks from the database with optional sorting parameters
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order ('asc' or 'desc')
 * @returns Paginated artworks with total pages and current page
 */
export async function fetchArtworksFromDBWithSorting(
  page: number = 1,
  pageSize: number = 15,
  sortBy: SortableColumn = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc',
): Promise<PaginatedArtworkResult> {
  try {
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artworks);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Build query base
    let query = db
      .select()
      .from(artworks)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Apply sorting based on parameters
    switch (sortBy) {
      case 'title':
        query = sortOrder === 'asc'
          ? query.orderBy(asc(artworks.title))
          : query.orderBy(desc(artworks.title));
        break;
      case 'artistName':
        query = sortOrder === 'asc'
          ? query.orderBy(asc(artworks.artistName))
          : query.orderBy(desc(artworks.artistName));
        break;
      case 'completitionYear':
        query = sortOrder === 'asc'
          ? query.orderBy(asc(artworks.completitionYear))
          : query.orderBy(desc(artworks.completitionYear));
        break;
      case 'createdAt':
        query = sortOrder === 'asc'
          ? query.orderBy(asc(artworks.createdAt))
          : query.orderBy(desc(artworks.createdAt));
        break;
      case 'updatedAt':
      default:
        query = sortOrder === 'asc'
          ? query.orderBy(asc(artworks.updatedAt))
          : query.orderBy(desc(artworks.updatedAt));
        break;
    }

    // Execute query
    const dbArtworks = await query;

    // Transform database results to Artwork type
    const processedArtworks = dbArtworks.map((artwork) => ({
      title: artwork.title,
      contentId: artwork.contentId,
      artistContentId: artwork.artistContentId,
      artistName: artwork.artistName,
      completitionYear: artwork.completitionYear ?? undefined,
      yearAsString: artwork.yearAsString ?? undefined,
      width: Number(artwork.width) ?? undefined,
      height: Number(artwork.height) ?? undefined,
      image: artwork.image,
    })).map(processArtwork);

    return {
      artworks: processedArtworks,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching artworks from database with sorting:", error);
    return { artworks: FALLBACK_ARTWORKS, totalPages: 1, currentPage: 1 };
  }
}
