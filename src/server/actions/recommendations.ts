"use server";

import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { artworks, artists } from "~/server/db/schema";
import { Artwork } from "~/lib/types/artwork";
import { fetchApi } from "./fetch-artworks-home";

interface ArtworksByArtistParams {
  artistId: number;
  limit?: number;
  artistUrl?: string;
}

function processArtwork(artwork) {
  return {
    ...artwork,
    image: artwork.image.replace('!Large.jpg', ''),
  };
}

export async function getRecommendations({ 
  artistId,
  artistUrl,
  limit = 12 
}: ArtworksByArtistParams) {
  try {
    let artistArtworks = await db
      .select({
        contentId: artworks.contentId,
        title: artworks.title,
        image: artworks.image,
        yearAsString: artworks.yearAsString,
        artist: {
          contentId: artists.contentId,
          artistName: artists.artistName,
        }
      })
      .from(artworks)
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(eq(artworks.artistContentId, artistId))
      .limit(limit);
      
    if (artistArtworks.length <= 6) { 
      const additionalArtworks = await fetchApi<Artwork[]>(
        `/App/Painting/PaintingsByArtist?artistUrl=${artistUrl}&json=2`
      );
      
      const newArtworks = additionalArtworks.map(artwork => ({
          contentId: artwork.contentId,
          title: artwork.title,
          image: artwork.image,
          yearAsString: artwork.yearAsString,
          artist: {
            contentId: artwork.artistContentId,
            artistName: artwork.artistName
          }
        }));
        artistArtworks = [...artistArtworks, ...newArtworks].slice(0, limit);
    }
    return artistArtworks.map(processArtwork);
  } catch (error) {
    console.error("Failed to get artworks by artist:", error);
    return [];
  }
}