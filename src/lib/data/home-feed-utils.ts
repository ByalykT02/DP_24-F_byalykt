import type { Artist } from "~/lib/types/artist";
import type { Artwork } from "~/lib/types/artwork";

export const MAX_ARTWORKS = 9;

export const FALLBACK_DATA = {
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

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = shuffled[i] as T;
    const target = shuffled[j] as T;
    shuffled[i] = target;
    shuffled[j] = current;
  }
  return shuffled;
}

export function processHomeArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  };
}
