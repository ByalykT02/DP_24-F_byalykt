import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { ArtworkDetailed } from "~/lib/types/artwork";

export async function ensureArtworkExists(artwork: ArtworkDetailed) {
  try {
    // First, ensure the artist exists
    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, artwork.artistContentId),
    });

    if (!existingArtist) {
      // Insert basic artist info
      await db.insert(artists).values({
        contentId: artwork.artistContentId,
        artistName: artwork.artistName,
        url: artwork.artistUrl,
        lastNameFirst: artwork.artistName, 
      })
      .onConflictDoNothing(); 
    }

    // Then, ensure the artwork exists
    const existingArtwork = await db.query.artworks.findFirst({
      where: eq(artworks.contentId, artwork.contentId),
    });

    if (!existingArtwork) {
      await db.insert(artworks).values({
        contentId: artwork.contentId,
        artistContentId: artwork.artistContentId,
        title: artwork.title,
        url: artwork.url || null,
        completitionYear: artwork.completitionYear || null,
        yearAsString: artwork.yearAsString || null,
        genre: artwork.genre || null,
        style: artwork.style || null,
        width: artwork.width ? Number(artwork.width) : null,
        height: artwork.height ? Number(artwork.height) : null,
        material: artwork.material || null,
        technique: artwork.technique || null,
        location: artwork.location || null,
        period: artwork.period || null,
        image: artwork.image || null,
        description: artwork.description || null,
      })
      .onConflictDoUpdate({
        target: [artworks.contentId],
        set: {
          title: artwork.title,
          image: artwork.image || null,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to ensure artwork exists:", error);
    return false;
  }
}