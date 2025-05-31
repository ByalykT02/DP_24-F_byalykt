"use server";

import { Artist } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api";

/**
 * Maximum number of artworks to return in a single request
 */
const MAX_ARTWORKS = 9;

/**
 * Fallback data to use when API calls fail
 */
const FALLBACK_DATA = {
  artist: {
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
  } as Artist,
  artworks: [
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
  ] as Artwork[],
};

/**
 * Shuffles an array using Fisher-Yates algorithm with random sorting
 * @template T - The type of elements in the array
 * @param {T[]} array - Array to be shuffled
 * @returns {T[]} A new shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

/**
 * Fetches a random artist from the WikiArt popular artists list
 * @returns {Promise<Artist>} Promise resolving to an Artist object
 */
async function getRandomArtist(): Promise<Artist> {
  try {
    const artists = await fetchWikiArtApi<Artist[]>(
      "/app/api/popularartists?json=1",
    );

    if (!artists || artists.length === 0) {
      console.warn("No artists returned from API, using fallback data");
      return FALLBACK_DATA.artist;
    }

    const randomIndex = Math.floor(Math.random() * artists.length);
    const selectedArtist = artists[randomIndex];
    
    // Verify that we have a valid artist object
    if (!selectedArtist) {
      console.warn("Selected artist is undefined, using fallback data");
      return FALLBACK_DATA.artist;
    }

    console.log(`Successfully fetched artist: ${selectedArtist.artistName} (${selectedArtist.url})`);
    return selectedArtist;
  } catch (error) {
    console.error("Error fetching random artist:", error instanceof Error ? error.message : String(error));
    return FALLBACK_DATA.artist;
  }
}

/**
 * Processes artwork image URLs to ensure consistent format
 * @param {Artwork} artwork - Artwork object to process
 * @returns {Artwork} Processed artwork with normalized image URL
 */
function processArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  };
}

/**
 * Fetches a collection of random artworks from a randomly selected artist
 * @returns {Promise<Artwork[]>} Promise resolving to an array of Artwork objects
 */
export async function fetchArtworks(): Promise<Artwork[]> {
  try {
    const artist = await getRandomArtist();

    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artist.url}&json=2`,
    );

    if (!artworks || artworks.length === 0) {
      console.warn(`No artworks found for artist ${artist.artistName}, using fallback data`);
      return FALLBACK_DATA.artworks;
    }

    // Ensure we have a diverse selection by shuffling and limit to maximum count
    const processedArtworks = shuffleArray(artworks)
      .slice(0, MAX_ARTWORKS)
      .map(processArtwork);

    console.log(`Successfully fetched ${processedArtworks.length} artworks by ${artist.artistName}`);

    return processedArtworks;
  } catch (error) {
    console.error("Error fetching artworks collection:", error instanceof Error ? error.message : String(error));
    return FALLBACK_DATA.artworks;
  }
}

/**
 * Fetches artworks from a specific artist by URL
 * @param {string} artistUrl - The URL identifier of the artist
 * @param {number} [limit=MAX_ARTWORKS] - Maximum number of artworks to return
 * @returns {Promise<Artwork[]>} Promise resolving to an array of Artwork objects
 */
export async function fetchArtworksByArtist(
  artistUrl: string,
  limit: number = MAX_ARTWORKS
): Promise<Artwork[]> {
  try {
    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artistUrl}&json=2`,
    );

    if (!artworks || artworks.length === 0) {
      console.warn(`No artworks found for artist URL ${artistUrl}, using fallback data`);
      return FALLBACK_DATA.artworks;
    }

    // Process and limit the number of returned artworks
    const processedArtworks = artworks
      .slice(0, limit)
      .map(processArtwork);

    console.log(`Successfully fetched ${processedArtworks.length} artworks for artist URL ${artistUrl}`);

    return processedArtworks;
  } catch (error) {
    console.error(`Error fetching artworks for artist ${artistUrl}:`, error instanceof Error ? error.message : String(error));
    return FALLBACK_DATA.artworks;
  }
}

/**
 * Fetches featured artworks for the home page with custom selection criteria
 * @param {number} [count=MAX_ARTWORKS] - Number of artworks to return
 * @returns {Promise<Artwork[]>} Promise resolving to an array of featured Artwork objects
 */
export async function fetchFeaturedArtworks(count: number = MAX_ARTWORKS): Promise<Artwork[]> {
  try {
    // Fetch from most popular paintings
    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/MostViewedPaintings?json=2`,
    );

    if (!artworks || artworks.length === 0) {
      console.warn("No popular artworks found, using fallback data");
      return FALLBACK_DATA.artworks;
    }

    // Process, shuffle for variety, and limit the number of returned artworks
    const processedArtworks = shuffleArray(artworks)
      .slice(0, count)
      .map(processArtwork);

    console.log(`Successfully fetched ${processedArtworks.length} featured artworks`);

    return processedArtworks;
  } catch (error) {
    console.error("Error fetching featured artworks:", error instanceof Error ? error.message : String(error));
    return FALLBACK_DATA.artworks;
  }
}