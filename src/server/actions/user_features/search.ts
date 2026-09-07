"use server";
import type { WikiArtSearchResult } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api";
import { logger } from "~/utils/logger";
import {
  processSearchResults,
  SEARCH_ARTIST_LIMIT,
  SEARCH_ARTWORK_LIMIT,
  SEARCH_MIN_QUERY_LENGTH,
} from "~/server/actions/user_features/search-utils";
import type { SearchResults } from "~/server/actions/user_features/search-utils";

export async function search(query: string): Promise<SearchResults> {
  if (!query || query.trim().length < SEARCH_MIN_QUERY_LENGTH) {
    return { artworks: [], artists: [] };
  }

  try {
    const searchResults = await fetchWikiArtApi<WikiArtSearchResult[]>(
      `/search/${encodeURIComponent(query.trim())}/1?json=2`,
    );

    // Process and organize the results
    const processedResults = processSearchResults(searchResults ?? []);

    // Limit the number of results if needed
    return {
      artworks: processedResults.artworks.slice(0, SEARCH_ARTWORK_LIMIT),
      artists: processedResults.artists.slice(0, SEARCH_ARTIST_LIMIT),
    };
  } catch (error) {
    logger.error("Search error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { artworks: [], artists: [] };
  }
}
