"use server";

import { Artist } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";

// Constants
const API_BASE_URL = "https://www.wikiart.org/en";
const MAX_ARTWORKS = 21;
const REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
  },
  next: { revalidate: 0 }, // Force revalidation on each request
} as const;

// Fallback data
const FALLBACK_DATA = {
  artist: {
    contentId: 227598,
    artistName: "Alphonse Mucha",
    url: "alphonse-mucha",
    lastNameFirst: "Mucha Alphonse",
    birthDayAsString: "July 24, 1860",
    deathDayAsString: "July 14, 1939",
    image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg!Portrait.jpg",
    wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
    dictonaries: [318, 7741],
  } as const,
  artworks: [
    {
      title: "The Starry Night",
      contentId: 1,
      artistContentId: 207187,
      artistName: "Vincent van Gogh",
      completitionYear: 1889,
      yearAsString: "1889",
      width: 921,
      height: 737,
      image: "https://uploads7.wikiart.org/images/vincent-van-gogh/the-starry-night-1889.jpg",
    },
  ] as const,
};

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Enhanced fetch with automatic timeout and error handling
export async function fetchApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

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

// Fetch random artist
async function getRandomArtist(): Promise<Artist> {
  try {
    const artists = await fetchApi<Artist[]>('/app/api/popularartists?json=1');
    const artist = artists[Math.floor(Math.random() * artists.length)] as Artist;
    console.log(`Artist fetched - ${artist.url}`)

    return artist;
  } catch (error) {
    console.error('Error fetching artist:', error);
    return FALLBACK_DATA.artist;
  }
}

// Process artwork image URLs
function processArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace('!Large.jpg', ''),
  };
}

// Main export
export async function fetchArtworks(): Promise<Artwork[]> {
  try {
    const artist = await getRandomArtist();
    
    const artworks = await fetchApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artist.url}&json=2`
    );

    return shuffleArray(artworks)
      .slice(0, MAX_ARTWORKS)
      .map(processArtwork);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return FALLBACK_DATA.artworks
  }
}