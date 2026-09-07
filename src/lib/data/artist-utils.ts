import type { Artist } from "~/lib/types/artist";

export function processArtist(artist: Artist): Artist {
  return {
    ...artist,
    image: artist.image?.replace("!Portrait.jpg", "") || "",
  };
}

export function normalizeArtistPagination(
  page: number,
  pageSize: number,
): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Math.floor(page) || 1),
    pageSize: Math.min(100, Math.max(1, Math.floor(pageSize) || 15)),
  };
}
