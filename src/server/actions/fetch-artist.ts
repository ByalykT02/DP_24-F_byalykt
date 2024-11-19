"use server";

import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";

// Constants
const MAX_ARTWORKS = 12;

// Fallback data
const FALLBACK_ARTIST: ArtistDetailed = {
  // Basic Info
  contentId: 227598,
  artistName: "Alphonse Mucha",
  url: "alphonse-mucha",
  lastNameFirst: "Mucha Alphonse",
  
  // Dates
  birthDay: "/Date(-3471292800000)/",
  deathDay: "/Date(-961776000000)/",
  birthDayAsString: "July 24, 1860",
  deathDayAsString: "July 14, 1939",
  
  // Additional Info
  originalArtistName: "Alfons Maria Mucha",
  gender: "male",
  biography: "Alphonse Mucha was a Czech painter, illustrator and graphic artist, living in Paris during the Art Nouveau period.",
  story: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  
  // Career Details
  activeYearsStart: null,
  activeYearsCompletion: null,
  series: "The Seasons\nSlav Epic\nDocuments Decoratifs",
  themes: "Art Nouveau, Decorative Art",
  periodsOfWork: "Paris Period (1887-1904)\nAmerican Period (1904-1910)\nCzech Period (1910-1939)",
  
  // Media
  image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg",
  wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  
  // Relations
  relatedArtistsIds: [],
  dictonaries: [318, 7741],
};


async function fetchApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`https://www.wikiart.org/en/${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
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
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function processArtist(artist: ArtistDetailed): ArtistDetailed {
  if (!artist) {
    throw new Error("Artist data not found");
  }
  
  return {
    ...artist,
    image: artist.image || FALLBACK_ARTIST.image,
  };
}

function processArtworks(artworks: Artwork[]): Artwork[] {
  return artworks.map(artwork => ({
    ...artwork,
    image: artwork.image.replace(/!.*\.jpg/, '.jpg'),
  }));
}

export async function fetchArtistDetails(url: string): Promise<{
  artist: ArtistDetailed;
  artworks: Artwork[];
}> {
  try {
    // Get artist details using the correct endpoint
    const artist = await fetchApi<ArtistDetailed>(
      `/${url}?json=2`
    );

    // Get artworks, using optional chaining and providing a default empty array
    const artworks = artist?.paintings || [];

    if (!artist) {
      throw new Error("Failed to fetch artist data");
    }

    return {
      artist: processArtist(artist),
      artworks: processArtworks(artworks.slice(0, MAX_ARTWORKS)),
    };
  } catch (error) {
    console.error('Error fetching artist details:', error);
    throw error;
  }
}