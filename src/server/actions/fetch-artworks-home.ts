"use server";

import { Artist } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "./fetch-api";

const MAX_ARTWORKS = 9;

// Fallback data
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
  },
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
  ],
};

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Fetch random artist
async function getRandomArtist(): Promise<Artist> {
  try {
    const artists = await fetchWikiArtApi<Artist[]>(
      "/app/api/popularartists?json=1",
    );

    const artist = artists[
      Math.floor(Math.random() * artists.length)
    ] as Artist;
    console.log(`Artist fetched - ${artist.url}`);

    return artist;
  } catch (error) {
    console.error("Error fetching artist:", error);
    return FALLBACK_DATA.artist;
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
export async function fetchArtworks(): Promise<Artwork[]> {
  try {
    const artist = await getRandomArtist();

    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${artist.url}&json=2`,
    );

    return shuffleArray(artworks).slice(0, MAX_ARTWORKS).map(processArtwork);
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return FALLBACK_DATA.artworks;
  }
}
