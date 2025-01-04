"use server";
import { Artist } from "~/lib/types/artist";
import { fetchWikiArtApi } from "./fetch-api";


// Fallback data
const FALLBACK_ARTISTS: Artist[] = [
  {
    contentId: 227598,
    artistName: "Alphonse Mucha",
    url: "alphonse-mucha",
    lastNameFirst: "Mucha Alphonse",
    birthDayAsString: "July 24, 1860",
    deathDayAsString: "July 14, 1939",
    image:
      "https://uploads6.wikiart.org/images/alphonse-mucha.jpg!Portrait.jpg",
    wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
    dictonaries: [318, 7741],
  },
];

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Process artist image URLs
function processArtist(artist: Artist): Artist {
  return {
    ...artist,
    image: artist.image.replace("!Portrait.jpg", ""),
  };
}

// Main export with pagination support
export async function fetchPopularArtists(
  page: number = 1,
  pageSize: number = 15,
): Promise<{
  artists: Artist[];
  totalPages: number;
  currentPage: number;
}> {
  try {
    const allArtists = await fetchWikiArtApi<Artist[]>(
      "/app/api/popularartists?json=1",
    );

    // Process and shuffle the artists
    // const processedArtists = shuffleArray(allArtists).map(processArtist);
    const processedArtists = allArtists.map(processArtist);

    // Calculate pagination
    const totalPages = Math.ceil(processedArtists.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedArtists = processedArtists.slice(
      startIndex,
      startIndex + pageSize,
    );

    return {
      artists: paginatedArtists,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching popular artists:", error);
    return {
      artists: FALLBACK_ARTISTS,
      totalPages: 1,
      currentPage: 1,
    };
  }
}
