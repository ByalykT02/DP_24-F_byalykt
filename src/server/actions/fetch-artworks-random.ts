"use server";

import { Artwork } from "~/lib/types/artwork";
import { db } from "../db";
import { artworks } from "../db/schema";
import { sql } from "drizzle-orm";

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
const FALLBACK_ARTWORKS = [
  {
    title: "The Starry Night",
    contentId: 1,
    artistContentId: 207187,
    artistName: "Vincent van Gogh",
    completitionYear: 1889,
    yearAsString: "1889",
    width: 921,
    height: 737,
    image:
      "https://uploads7.wikiart.org/images/vincent-van-gogh/the-starry-night-1889.jpg",
  },
];

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
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
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw new Error(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// Process artwork image URLs
function processArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  };
}

// Main export
export async function fetchRandomArtworks(): Promise<Artwork[]> {
  try {
    // Generate a random seed
    //const randomSeed = Math.floor(Math.random() * 1000);

    // const artworks = await fetchApi<Artwork[]>(
    //   `/App/Painting/MostViewedPaintings?randomSeed=${randomSeed}&json=2`
    // );
    //

    const dbArtworks = await db
      .select()
      .from(artworks)
      .orderBy(sql`RANDOM()`)
      .limit(64);
    // return shuffleArray(artworks)
    //   .slice(0, MAX_ARTWORKS)
    //   .map(processArtwork);
    //
    return dbArtworks;
  } catch (error) {
    console.error("Error fetching random artworks:", error);
    return FALLBACK_ARTWORKS;
  }
}
