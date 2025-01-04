"use server";

import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork, ArtworkDetailed } from "~/lib/types/artwork";
import { logger } from "~/utils/logger";
import { fetchWikiArtApi } from "./fetch-api";

// Fallback data
const FALLBACK_ARTIST: ArtistDetailed = {
  contentId: 227598,
  artistName: "Alphonse Mucha",
  url: "alphonse-mucha",
  lastNameFirst: "Mucha Alphonse",
  birthDay: "/Date(-3453580800000)/",
  deathDay: "/Date(-961545600000)/",
  birthDayAsString: "July 24, 1860",
  deathDayAsString: "July 14, 1939",
  originalArtistName: "Alfons Maria Mucha",
  gender: "male",
  biography: " ",
  story: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  activeYearsStart: "1868",
  activeYearsCompletion: "1938",
  series: "Slav Epic\r\nThe seasons\r\nArt Posters\r\nThe Times of the Day",
  themes: "",
  periodsOfWork: "",
  image: "https://uploads6.wikiart.org/images/alphonse-mucha.jpg!Portrait.jpg",
  wikipediaUrl: "http://en.wikipedia.org/wiki/Alphonse_Mucha",
  relatedArtistsIds: [],
  dictonaries: [318, 7741],
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

function convertJsonDate(jsonDate: string): Date {
  const match = jsonDate.match(/\/Date\((-?\d+)\)\//);
  if (!match) {
    throw new Error(`Invalid JSON date format: ${jsonDate}`);
  }
  return new Date(parseInt(match[1]!, 10));
}

function processArtist(artist: ArtistDetailed): ArtistDetailed {
  const log = logger.child({
    action: "processArtist",
    artistId: artist?.contentId,
  });

  if (!artist) {
    log.error("Artist data missing");
    throw new Error("Artist data not found");
  }

  log.info("Processing artist data");
  return {
    ...artist,
    image: artist.image || FALLBACK_ARTIST.image,
    birthDay: convertJsonDate(artist?.birthDay!).toISOString(),
    deathDay: convertJsonDate(artist?.deathDay!).toISOString(),
  };
}

function processArtworks(artworks: Artwork[]): Artwork[] {
  const log = logger.child({
    action: "processArtworks",
    artworkCount: artworks.length,
  });

  log.info("Processing artworks");
  return artworks.map((artwork) => ({
    ...artwork,
    image: artwork.image.replace("!Large.jpg", ""),
  }));
}

export async function fetchArtistDetails(url: string) {
  const log = logger.child({
    action: "fetchArtistDetails",
    artistUrl: url,
  });

  try {
    log.info("Fetching artist details");

    const artist = await fetchWikiArtApi<ArtistDetailed>(`/${url}?json=2`);
    if (!artist) {
      log.error("Artist data not found");
      throw new Error("Artist data not found");
    }
    log.info("Artist details fetched", { artistId: artist.contentId });

    const artworks = await fetchWikiArtApi<Artwork[]>(
      `/App/Painting/PaintingsByArtist?artistUrl=${url}&json=2`,
    );
    log.info("Artworks fetched", { count: artworks.length });

    const processedData = {
      artist: processArtist(artist || FALLBACK_ARTIST),
      artworks: processArtworks(
        artworks?.length ? artworks : FALLBACK_ARTWORKS,
      ),
    };

    log.info("Artist details processed successfully", {
      artistId: artist.contentId,
      artworksCount: artworks.length,
    });

    return processedData;
  } catch (error) {
    log.error("Failed to fetch artist details", { error });
    return {
      artist: processArtist(FALLBACK_ARTIST),
      artworks: processArtworks(FALLBACK_ARTWORKS),
    };
  }
}
