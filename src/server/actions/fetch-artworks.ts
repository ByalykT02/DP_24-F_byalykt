"use server";

import { Artwork } from "~/lib/types/artwork";
import { db } from "../db";
import { artworks } from "../db/schema";
import { asc, desc, sql } from "drizzle-orm";
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

// Deprecated: random artowks from the DataArt API
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

export async function fetchArtworksFromDB(
  page: number = 1,
  pageSize: number = 15,
): Promise<{
  artworks: Artwork[];
  totalPages: number;
  currentPage: number;
}> {
  try {
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artworks);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    const dbArtworks = await db
      .select()
      .from(artworks)
      .orderBy(asc(artworks.updatedAt) )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const processedArtworks = dbArtworks
      .map((artwork) => ({
        title: artwork.title,
        contentId: artwork.contentId,
        artistContentId: artwork.artistContentId,
        artistName: artwork.artistName,
        completitionYear: artwork.completitionYear ?? undefined,
        yearAsString: artwork.yearAsString ?? undefined,
        width: Number(artwork.width) ?? undefined,
        height: Number(artwork.height) ?? undefined,
        image: artwork.image,
      }))
      .map(processArtwork);

    return {
      artworks: processedArtworks,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching random artworks from database:", error);
    return { artworks: FALLBACK_ARTWORKS, totalPages: 1, currentPage: 1 };
  }
}
