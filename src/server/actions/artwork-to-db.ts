"use server";

import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { logger, logging } from "~/utils/logger";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { z } from "zod";

// Validation schemas
const artistSchema = z.object({
  contentId: z.number().positive(),
  artistName: z.string().min(1),
  artistUrl: z.string().nullable(),
});

const artworkSchema = z.object({
  contentId: z.number().positive(),
  artistContentId: z.number().positive(),
  artistName: z.string().min(1),
  artistUrl: z.string().nullable(),
  title: z.string().min(1),
  url: z.string().nullable(), // Remove .url() validation since it might be a relative path
  completitionYear: z.number().nullable(),
  yearAsString: z.string().nullable(),
  genre: z.string().nullable(),
  tags: z.string().nullable(), // Changed from array to string to match DB schema
  style: z.string().nullable(),
  dictionaries: z.union([z.array(z.union([z.string(), z.number()])), z.null()]), // Allow both string and number
  width: z.number().nullable(),
  height: z.number().nullable(),
  material: z.string().nullable(),
  technique: z.string().nullable(),
  location: z.string().nullable(),
  period: z.string().nullable(),
  image: z.string().min(1),
  description: z.string().nullable(),
});

// Custom error types
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ARTIST_ERROR = 'ARTIST_ERROR',
  ARTWORK_ERROR = 'ARTWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

class ArtworkError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ArtworkError';
  }
}

/**
 * Ensures an artist exists in the database
 * @throws {ArtworkError} If artist creation/update fails
 */
async function ensureArtistExists(
  artistContentId: number,
  artistName: string,
  artistUrl: string | null,
): Promise<void> {
  const logger = logging.child({
    action: 'ensureArtistExists',
    artistContentId,
    artistName,
  });

  try {
    // Validate artist data
    const validatedArtist = artistSchema.parse({
      contentId: artistContentId,
      artistName,
      artistUrl,
    });

    const existingArtist = await db.query.artists.findFirst({
      where: eq(artists.contentId, validatedArtist.contentId),
    });

    if (!existingArtist) {
      logger.info('Creating new artist record');
      await db
        .insert(artists)
        .values({
          contentId: validatedArtist.contentId,
          artistName: validatedArtist.artistName,
          url: validatedArtist.artistUrl,
        })
        .onConflictDoNothing();
      
      logger.info('Artist created successfully');
    } else {
      logger.debug('Artist already exists', { artistId: existingArtist.contentId });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ArtworkError(
        'Invalid artist data',
        ErrorCode.VALIDATION_ERROR,
        error.errors,
      );
    }
    
    logger.error('Failed to ensure artist exists', error);
    throw new ArtworkError(
      'Failed to ensure artist exists',
      ErrorCode.ARTIST_ERROR,
      error,
    );
  }
}

/**
 * Ensures an artwork exists in the database
 * Creates or updates both the artwork and associated artist
 */
export async function ensureArtworkExists(artwork: ArtworkDetailed) {
  const logger = logging.child({
    action: 'ensureArtworkExists',
    artworkId: artwork.contentId,
  });

  try {
    // Validate artwork data
    const validatedArtwork = artworkSchema.parse(artwork);
    logger.info('Ensuring artwork exists', { title: validatedArtwork.title });

    // Ensure artist exists first
    await ensureArtistExists(
      validatedArtwork.artistContentId,
      validatedArtwork.artistName,
      validatedArtwork.artistUrl,
    );

    // Prepare artwork data
    const artworkData = {
      contentId: validatedArtwork.contentId,
      artistContentId: validatedArtwork.artistContentId,
      title: validatedArtwork.title,
      url: validatedArtwork.url,
      completitionYear: validatedArtwork.completitionYear,
      yearAsString: validatedArtwork.yearAsString,
      genre: validatedArtwork.genre,
      tags: validatedArtwork.tags,
      style: validatedArtwork.style,
      dictionaries: validatedArtwork.dictionaries,
      width: validatedArtwork.width,
      height: validatedArtwork.height,
      material: validatedArtwork.material,
      technique: validatedArtwork.technique,
      location: validatedArtwork.location,
      period: validatedArtwork.period,
      image: validatedArtwork.image,
      description: validatedArtwork.description,
      updatedAt: new Date(),
    };

    const existingArtwork = await db.query.artworks.findFirst({
      where: eq(artworks.contentId, validatedArtwork.contentId),
    });

    if (!existingArtwork) {
      logger.info('Creating new artwork record');
      await db
        .insert(artworks)
        .values({
          ...artworkData,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [artworks.contentId],
          set: artworkData,
        });
      
      logger.info('Artwork created successfully');
    } else {
      logger.info('Updating existing artwork');
      await db
        .update(artworks)
        .set(artworkData)
        .where(eq(artworks.contentId, validatedArtwork.contentId));
      
      logger.info('Artwork updated successfully');
    }

    return {
      success: true,
      data: {
        artworkId: validatedArtwork.contentId,
        title: validatedArtwork.title,
      },
    };

  } catch (error) {
    logger.error('Failed to ensure artwork exists', error);

    if (error instanceof ArtworkError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid artwork data',
        code: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      };
    }

    return {
      success: false,
      error: 'Failed to ensure artwork exists',
      code: ErrorCode.DATABASE_ERROR,
    };
  }
}