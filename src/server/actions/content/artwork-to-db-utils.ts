import type { ArtworkDetailed } from "~/lib/types/artwork";

/**
 * Checks if the artist data is valid
 */
export function isValidArtist(data: {
  contentId: number;
  artistName: string;
  artistUrl: string | null;
}): boolean {
  return (
    !!data.contentId &&
    data.contentId > 0 &&
    !!data.artistName &&
    data.artistName.trim().length > 0
  );
}

/**
 * Checks if the artwork data is valid
 */
export function isValidArtwork(data: ArtworkDetailed): boolean {
  return (
    !!data.contentId &&
    data.contentId > 0 &&
    !!data.artistContentId &&
    data.artistContentId > 0 &&
    !!data.title &&
    data.title.trim().length > 0 &&
    !!data.image &&
    data.image.trim().length > 0
  );
}

export const ARTIST_STALENESS_DAYS = 30;
