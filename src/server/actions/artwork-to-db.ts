import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { ArtworkDetailed } from "~/lib/types/artwork";

export async function ensureArtworkExists(artwork: ArtworkDetailed) {
  try {
    console.log(`Ensuring artwork exists: ${artwork.contentId} - "${artwork.title}"`);
    
    // Step 1: Ensure the artist exists
    console.log(`Checking if artist exists: ${artwork.artistContentId} - "${artwork.artistName}"`);
    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, artwork.artistContentId),
    });

    if (!existingArtist) {
      console.log(`Artist not found. Inserting new artist: ${artwork.artistContentId} - "${artwork.artistName}"`);
      await db
        .insert(artists)
        .values({
          contentId: artwork.artistContentId,
          artistName: artwork.artistName,
          url: artwork.artistUrl,
          lastNameFirst: artwork.artistName, 
        })
        .onConflictDoNothing();
    } else {
      console.log(`Artist already exists: ${artwork.artistContentId} - "${existingArtist.artistName}"`);
    }

    // Step 2: Ensure the artwork exists
    console.log(`Checking if artwork exists: ${artwork.contentId} - "${artwork.title}"`);
    const existingArtwork = await db.query.artworks.findFirst({
      where: eq(artworks.contentId, artwork.contentId),
    });

    if (!existingArtwork) {
      console.log(`Artwork not found. Inserting new artwork: ${artwork.contentId} - "${artwork.title}"`);
      await db
        .insert(artworks)
        .values({
          contentId: artwork.contentId,
          artistContentId: artwork.artistContentId,
          title: artwork.title,
          url: artwork.url,
          completitionYear: artwork.completitionYear,
          yearAsString: artwork.yearAsString,
          genre: artwork.genre,
          tags: artwork.tags,
          style: artwork.style,
          dictionaries: artwork.dictionaries,
          width: artwork.width,
          height: artwork.height,
          material: artwork.material,
          technique: artwork.technique,
          location: artwork.location,
          period: artwork.period,
          image: artwork.image,
          description: artwork.description,
        })
        .onConflictDoUpdate({
          target: [artworks.contentId],
          set: {
            title: artwork.title,
            image: artwork.image,
          },
        });
      console.log(`Artwork inserted successfully: ${artwork.contentId} - "${artwork.title}"`);
    } else {
      console.log(`Artwork already exists: ${artwork.contentId} - "${existingArtwork.title}"`);
    }

    console.log(`Successfully ensured artwork exists: ${artwork.contentId} - "${artwork.title}"`);
    return true;
  } catch (error) {
    console.error("Failed to ensure artwork exists:", error);
    return false;
  }
}
