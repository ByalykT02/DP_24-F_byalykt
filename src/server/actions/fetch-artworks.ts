"use server";

import { Artwork } from "~/lib/types/artwork";
import { db } from "../db";
import { artworks } from "../db/schema";
import { sql } from "drizzle-orm";
import { fetchWikiArtApi } from "./fetch-api";

// Fallback data
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

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Process artwork image URLs
function processArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  };
}

// Main export
export async function fetchRandomArtworks(
  page: number = 1,
  pageSize: number = 15,
): Promise<{
  artworks: Artwork[];
  totalPages: number;
  currentPage: number;
}> {
  try {
    // Generate a random seed
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
    // return dbArtworks;
  } catch (error) {
    console.error("Error fetching random artworks:", error);
    return { artworks: FALLBACK_ARTWORKS, totalPages: 1, currentPage: 1 };
  }
}
