"use server";

import { db } from "~/server/db";
import {
  userCollections,
  collectionItems,
  artworks,
  artists,
  users,
} from "~/server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  ApiResponse,
  CollectionWithDetails,
  CollectionWithItems,
  CreateCollectionParams,
} from "~/lib/types/collection";
import { logging } from "~/utils/logger";

export async function createCollection(
  params: CreateCollectionParams,
): Promise<ApiResponse<CollectionWithDetails>> {
  const logger = logging.child({ 
    operation: 'createCollection', 
    userId: params.userId 
  });
  
  logger.info('Creating new collection', { collectionName: params.name });
  
  try {
    const [collection] = await db
      .insert(userCollections)
      .values(params)
      .returning();

    logger.info('Collection created successfully', { collectionId: collection.id });
    
    return {
      success: true,
      data: {
        ...collection,
        previewImage: null,
        itemCount: 0,
      },
    };
  } catch (error) {
    logging.error('Failed to create collection', error);
    return { success: false, error: "Failed to create collection" };
  }
}

export async function getUserCollections(
  userId: string,
): Promise<ApiResponse<CollectionWithDetails[]>> {
  const logger = logging.child({ 
    operation: 'getUserCollections', 
    userId 
  });
  
  logger.info('Fetching user collections');
  
  try {
    const collections = await db
      .select({
        id: userCollections.id,
        name: userCollections.name,
        description: userCollections.description,
        isPublic: userCollections.isPublic,
        createdAt: userCollections.createdAt,
      })
      .from(userCollections)
      .where(eq(userCollections.userId, userId))
      .orderBy(userCollections.createdAt);

    logger.debug('Retrieved base collections', { count: collections.length });

    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        const previewItem = await db
          .select({
            image: artworks.image,
          })
          .from(collectionItems)
          .innerJoin(
            artworks,
            eq(collectionItems.artworkId, artworks.contentId),
          )
          .where(eq(collectionItems.collectionId, collection.id))
          .limit(1);

        const count = await db
          .select({ count: sql`count(*)` })
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          ...collection,
          previewImage: previewItem[0]?.image || null,
          itemCount: Number(count[0]?.count || 0),
        };
      }),
    );

    logger.info('Successfully retrieved collections with details', {
      collectionCount: collectionsWithDetails.length
    });

    return {
      success: true,
      data: collectionsWithDetails,
    };
  } catch (error) {
    logging.error('Failed to get user collections', error);
    return {
      success: false,
      error: "Failed to get user collections",
    };
  }
}

export async function getCollection(
  userId: string | null,
  collectionId: number,
): Promise<ApiResponse<CollectionWithItems | null>> {
  const logger = logging.child({ 
    operation: 'getCollection', 
    userId, 
    collectionId 
  });
  
  logger.info('Fetching collection details');
  
  try {
    const collection = await db
      .select({
        id: userCollections.id,
        name: userCollections.name,
        description: userCollections.description,
        isPublic: userCollections.isPublic,
        userId: userCollections.userId,
        createdAt: userCollections.createdAt,
      })
      .from(userCollections)
      .where(eq(userCollections.id, collectionId))
      .limit(1);

    if (!collection.length) {
      logger.warn('Collection not found');
      return { success: false, error: "Collection not found" };
    }

    const isOwner = userId === collection[0]?.userId;
    if (!isOwner && !collection[0]?.isPublic) {
      logger.warn('Access denied to private collection', { 
        requestedBy: userId,
        collectionOwner: collection[0]?.userId 
      });
      return { success: false, error: "Access denied" };
    }

    const items = await db
      .select({
        id: collectionItems.id,
        artwork: {
          contentId: artworks.contentId,
          title: artworks.title,
          image: artworks.image,
          artistName: artists.artistName,
        },
      })
      .from(collectionItems)
      .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
      .innerJoin(artists, eq(artworks.artistContentId, artists.contentId))
      .where(eq(collectionItems.collectionId, collectionId));

    logger.info('Collection retrieved successfully', { 
      itemCount: items.length,
      isPublic: collection[0]?.isPublic,
      isOwner
    });

    const previewImage = items[0]?.artwork?.image || null;
    return {
      success: true,
      data: {
        ...collection[0],
        previewImage,
        itemCount: items.length,
        items,
        isOwner,
      },
    };
  } catch (error) {
    logging.error('Failed to get collection', error);
    return { success: false, error: "Failed to get collection" };
  }
}

export async function getPublicCollections(): Promise<
  ApiResponse<CollectionWithDetails[]>
> {
  const logger = logging.child({ operation: 'getPublicCollections' });
  
  logger.info('Fetching public collections');
  
  try {
    const collections = await db
      .select({
        id: userCollections.id,
        name: userCollections.name,
        description: userCollections.description,
        userId: userCollections.userId,
        createdAt: userCollections.createdAt,
        user: {
          name: users.name,
        },
      })
      .from(userCollections)
      .innerJoin(users, eq(userCollections.userId, users.id))
      .where(eq(userCollections.isPublic, true))
      .orderBy(desc(userCollections.createdAt));

    logger.debug('Retrieved base public collections', { 
      count: collections.length 
    });

    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        const previewItem = await db
          .select({
            image: artworks.image,
          })
          .from(collectionItems)
          .innerJoin(
            artworks,
            eq(collectionItems.artworkId, artworks.contentId),
          )
          .where(eq(collectionItems.collectionId, collection.id))
          .limit(1);

        const count = await db
          .select({ count: sql`count(*)` })
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          ...collection,
          previewImage: previewItem[0]?.image || null,
          itemCount: Number(count[0]?.count || 0),
        };
      }),
    );

    logger.info('Successfully retrieved public collections with details', {
      collectionCount: collectionsWithDetails.length
    });

    return { success: true, data: collectionsWithDetails };
  } catch (error) {
    logging.error('Failed to get public collections', error);
    return { success: false, error: "Failed to get public collections" };
  }
}

export async function updateCollection(params: {
  userId: string;
  collectionId: number;
  name: string;
  description?: string;
  isPublic: boolean | null;
}): Promise<ApiResponse<CollectionWithDetails>> {
  const logger = logging.child({ 
    operation: 'updateCollection',
    userId: params.userId,
    collectionId: params.collectionId
  });
  
  logger.info('Updating collection', {
    name: params.name,
    isPublic: params.isPublic
  });
  
  try {
    const [collection] = await db
      .update(userCollections)
      .set({
        name: params.name,
        description: params.description,
        isPublic: params.isPublic,
      })
      .where(
        and(
          eq(userCollections.id, params.collectionId),
          eq(userCollections.userId, params.userId),
        ),
      )
      .returning();

    if (!collection) {
      logger.warn('Collection not found or user not authorized');
      return { success: false, error: "Collection not found" };
    }

    const previewItem = await db
      .select({
        image: artworks.image,
      })
      .from(collectionItems)
      .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
      .where(eq(collectionItems.collectionId, collection.id))
      .limit(1);

    const count = await db
      .select({ count: sql`count(*)` })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collection.id));

    logger.info('Collection updated successfully', {
      collectionId: collection.id
    });

    return {
      success: true,
      data: {
        ...collection,
        previewImage: previewItem[0]?.image || null,
        itemCount: Number(count[0]?.count || 0),
      },
    };
  } catch (error) {
    logging.error('Failed to update collection', error);
    return { success: false, error: "Failed to update collection" };
  }
}

export async function addToCollection(
  userId: string,
  collectionId: number,
  artworkId: number,
): Promise<ApiResponse<void>> {
  const logger = logging.child({ 
    operation: 'addToCollection',
    userId,
    collectionId,
    artworkId
  });
  
  logger.info('Adding artwork to collection');
  
  try {
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId),
        ),
      )
      .limit(1);

    if (!collection.length) {
      logger.warn('Collection not found or user not authorized');
      return { success: false, error: "Collection not found" };
    }

    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.artworkId, artworkId),
        ),
      )
      .limit(1);

    if (existing.length) {
      logger.warn('Artwork already exists in collection', { artworkId });
      return { success: false, error: "Artwork already in collection" };
    }

    await db.insert(collectionItems).values({
      collectionId,
      artworkId,
    });

    logger.info('Artwork added to collection successfully');
    return { success: true };
  } catch (error) {
    logging.error('Failed to add to collection', error);
    return { success: false, error: "Failed to add to collection" };
  }
}

export async function removeFromCollection(
  userId: string,
  collectionId: number,
  artworkId: number,
): Promise<ApiResponse<void>> {
  const logger = logging.child({ 
    operation: 'removeFromCollection',
    userId,
    collectionId,
    artworkId
  });
  
  logger.info('Removing artwork from collection');
  
  try {
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId),
        ),
      )
      .limit(1);

    if (!collection.length) {
      logger.warn('Collection not found or user not authorized');
      return { success: false, error: "Collection not found" };
    }

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.artworkId, artworkId),
        ),
      );

    logger.info('Artwork removed from collection successfully');
    return { success: true };
  } catch (error) {
    logging.error('Failed to remove from collection', error);
    return { success: false, error: "Failed to remove from collection" };
  }
}

export async function deleteCollection(
  userId: string,
  collectionId: number,
): Promise<ApiResponse<void>> {
  const logger = logging.child({ 
    operation: 'deleteCollection',
    userId,
    collectionId
  });
  
  logger.info('Deleting collection');
  
  try {
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId),
        ),
      )
      .limit(1);

    if (!collection.length) {
      logger.warn('Collection not found or user not authorized');
      return { success: false, error: "Collection not found" };
    }

    await db
      .delete(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));

    await db
      .delete(userCollections)
      .where(eq(userCollections.id, collectionId));

    logger.info('Collection deleted successfully');
    return { success: true };
  } catch (error) {
    logging.error('Failed to delete collection', error);
    return { success: false, error: "Failed to delete collection" };
  }
}