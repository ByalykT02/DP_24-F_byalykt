"use server";
import { db } from "~/server/db";
import { artists, artworks } from "~/server/db/schema";
import { ilike, or, eq } from "drizzle-orm";
import { WikiArtSearchResult } from "~/lib/types/artwork";

const API_BASE_URL = "https://www.wikiart.org/en";
const REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
  },
  next: { revalidate: 3600 }, // Cache for 1 hour
} as const;

interface SearchResults {
  artworks: {
    contentId: number;
    title: string;
    image: string;
    artistName: string;
    yearAsString: string | null;
    type: 'artwork';
  }[];
  artists: {
    contentId: number;
    artistName: string;
    type: 'artist';
  }[];
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...REQUEST_CONFIG,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new Error(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function processSearchResults(results: WikiArtSearchResult[]): SearchResults {
  // Create a Map to store unique artists
  const artistsMap = new Map<number, { contentId: number; artistName: string; }>();

  // Process artworks and collect unique artists
  const artworks = results.map(result => {
    // Add artist to map if not already present
    if (!artistsMap.has(result.artistContentId)) {
      artistsMap.set(result.artistContentId, {
        contentId: result.artistContentId,
        artistName: result.artistName,
      });
    }

    return {
      contentId: result.contentId,
      title: result.title,
      image: result.image.replace('!Large.jpg', ''),
      artistName: result.artistName,
      yearAsString: result.yearAsString,
      type: 'artwork' as const
    };
  });

  // Convert artists map to array
  const artists = Array.from(artistsMap.values()).map(artist => ({
    ...artist,
    type: 'artist' as const
  }));

  return {
    artworks,
    artists
  };
}

export async function search(query: string): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return { artworks: [], artists: [] };
  }

  try {
    console.log("Searching for:", query);
    
    const searchResults = await fetchApi<WikiArtSearchResult[]>(
      `/search/${encodeURIComponent(query)}/1?json=2`
    );

    console.log(`Found ${searchResults.length} results`);

    // Process and organize the results
    const processedResults = processSearchResults(searchResults);

    // Limit the number of results if needed
    return {
      artworks: processedResults.artworks.slice(0, 5),
      artists: processedResults.artists.slice(0, 5)
    };

  } catch (error) {
    console.error("Search error:", error);
    return { artworks: [], artists: [] };
  }
}