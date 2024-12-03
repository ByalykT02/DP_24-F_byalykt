"use server";
import { Artist } from "~/lib/types/artist";

// Constants
const API_BASE_URL = "https://www.wikiart.org/en";
const REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
  },
  next: { revalidate: 0 }, // Force revalidation on each request
} as const;

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

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Enhanced fetch with automatic timeout and error handling
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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw new Error(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// Process artist image URLs
function processArtist(artist: Artist): Artist {
  return {
    ...artist,
    image: artist.image.replace('!Portrait.jpg', ''),
  };
}

// Main export with pagination support
export async function fetchPopularArtists(page: number = 1, pageSize: number = 15): Promise<{
  artists: Artist[];
  totalPages: number;
  currentPage: number;
}> {
  try {
    const allArtists = await fetchApi<Artist[]>(
      '/app/api/popularartists?json=1'
    );
    
    // Process and shuffle the artists
    const processedArtists = shuffleArray(allArtists).map(processArtist);
    
    // Calculate pagination
    const totalPages = Math.ceil(processedArtists.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedArtists = processedArtists.slice(startIndex, startIndex + pageSize);
    
    return {
      artists: paginatedArtists,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error fetching popular artists:', error);
    return {
      artists: FALLBACK_ARTISTS,
      totalPages: 1,
      currentPage: 1
    };
  }
}