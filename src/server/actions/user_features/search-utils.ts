/**
 * Pure search helpers (no `"use server"`).
 *
 * Next.js server-action modules may only export async functions, so the
 * synchronous WikiArt search normalization lives here where unit tests can
 * import it without breaking `next build`.
 */
import type { WikiArtSearchResult } from "~/lib/types/artwork";

/** WikiArt search endpoint returns at most these many items per category. */
export const SEARCH_ARTWORK_LIMIT = 5;
export const SEARCH_ARTIST_LIMIT = 5;
/** Minimum characters before a WikiArt `/search/<term>/1?json=2` request is issued. */
export const SEARCH_MIN_QUERY_LENGTH = 2;

export interface SearchResults {
  artworks: {
    contentId: number;
    title: string;
    image: string;
    artistName: string;
    yearAsString: string | null;
    type: "artwork";
  }[];
  artists: {
    contentId: number;
    artistName: string;
    url: string | undefined;
    type: "artist";
  }[];
}

/**
 * Normalize raw WikiArt `/search/<term>/1?json=2` rows:
 * - strips the `!Large.jpg` size suffix from artwork images,
 * - de-duplicates artists by `artistContentId` (artist slug is derived from
 *   the `/images/<slug>/` segment of the artwork image URL).
 */
export function processSearchResults(
  results: WikiArtSearchResult[],
): SearchResults {
  // Create a Map to store unique artists
  const artistsMap = new Map<
    number,
    { contentId: number; artistName: string; url: string | undefined }
  >();

  // Process artworks and collect unique artists
  const artworks = results.map((result) => {
    // Add artist to map if not already present
    let artistUrl: string | undefined;
    const urlMatch = result.image.match(/\/images\/([^/]+)\//);
    artistUrl = urlMatch?.[1];

    if (!artistsMap.has(result.artistContentId)) {
      artistsMap.set(result.artistContentId, {
        contentId: result.artistContentId,
        artistName: result.artistName,
        url: artistUrl,
      });
    }

    return {
      contentId: result.contentId,
      title: result.title,
      image: result.image.replace("!Large.jpg", ""),
      artistName: result.artistName,
      yearAsString: result.yearAsString,
      type: "artwork" as const,
    };
  });

  // Convert artists map to array
  const artists = Array.from(artistsMap.values()).map((artist) => ({
    ...artist,
    type: "artist" as const,
  }));

  return {
    artworks,
    artists,
  };
}
