"use server";

import { db } from "~/server/db";
import {
  userCollections,
  collectionItems,
  artworks,
  artists,
  users,
} from "~/server/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import {
  CollectionWithDetails,
  CollectionWithItems,
  CreateCollectionParams,
} from "~/lib/types/collection";
import { logger } from "~/utils/logger";
import { ApiResponse } from "~/lib/types/api";

/**
 * Create a new collection
 */
export async function createCollection(
  params: CreateCollectionParams,
): Promise<ApiResponse<CollectionWithDetails>> {
  const log = logger.child({
    operation: "createCollection",
    userId: params.userId,
  });

  log.info("Creating new collection", { collectionName: params.name });

  try {
    const [collection] = await db
      .insert(userCollections)
      .values({
        ...params,
        updatedAt: new Date() // Ensure updatedAt is set
      })
      .returning();

    if (!collection) {
      log.warn("Failed to create collection");
      return { success: false, error: "Failed to create collection" };
    }

    log.info("Collection created successfully", {
      collectionId: collection.id,
    });

    return {
      success: true,
      data: {
        ...collection,
        previewImage: null,
        itemCount: 0,
      },
    };
  } catch (error) {
    log.error("Failed to create collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return { success: false, error: "Failed to create collection" };
  }
}

/**
 * Helper function to fetch collection details efficiently
 * Reduces N+1 query problem by using a single query for preview images
 * and a single query for item counts
 */
async function fetchCollectionDetails(collections: any[]): Promise<CollectionWithDetails[]> {
  if (collections.length === 0) return [];
  
  const collectionIds = collections.map(c => c.id);
  
  // Get all preview images in a single query
  const previewImages = await db
    .select({
      collectionId: collectionItems.collectionId,
      image: artworks.image,
    })
    .from(collectionItems)
    .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
    .where(inArray(collectionItems.collectionId, collectionIds))
    .orderBy(collectionItems.collectionId, collectionItems.id)
    .execute();
  
  // Create a map of collectionId → preview image
  const previewImageMap = previewImages.reduce((acc, item) => {
    if (!acc.has(item.collectionId)) {
      acc.set(item.collectionId, item.image);
    }
    return acc;
  }, new Map<number, string>());
  
  // Get all item counts in a single query
  const itemCounts = await db
    .select({
      collectionId: collectionItems.collectionId,
      count: sql<string>`count(*)`,
    })
    .from(collectionItems)
    .where(inArray(collectionItems.collectionId, collectionIds))
    .groupBy(collectionItems.collectionId)
    .execute();
  
  // Create a map of collectionId → count
  const countMap = itemCounts.reduce((acc, item) => {
    acc.set(item.collectionId, Number(item.count));
    return acc;
  }, new Map<number, number>());
  
  // Combine the data
  return collections.map(collection => ({
    ...collection,
    previewImage: previewImageMap.get(collection.id) || null,
    itemCount: countMap.get(collection.id) || 0,
  }));
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(
  userId: string,
): Promise<ApiResponse<CollectionWithDetails[]>> {
  const log = logger.child({
    operation: "getUserCollections",
    userId,
  });

  log.info("Fetching user collections");

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

    log.debug("Retrieved base collections", { count: collections.length });
    
    // Use the optimized helper function to add details
    const collectionsWithDetails = await fetchCollectionDetails(collections);

    log.info("Successfully retrieved collections with details", {
      collectionCount: collectionsWithDetails.length,
    });

    return {
      success: true,
      data: collectionsWithDetails,
    };
  } catch (error) {
    log.error("Failed to get user collections", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: "Failed to get user collections",
    };
  }
}

/**
 * Get a single collection with all items
 */
export async function getCollection(
  userId: string,
  collectionId: number,
): Promise<ApiResponse<CollectionWithItems>> {
  const log = logger.child({
    operation: "getCollection",
    userId,
    collectionId,
  });

  log.info("Fetching collection details");

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
      .limit(1)
      .then(results => results[0]);

    if (!collection) {
      log.warn("Collection not found");
      return { success: false, error: "Collection not found" };
    }

    const isOwner = userId === collection.userId;
    if (!isOwner && !collection.isPublic) {
      log.warn("Access denied to private collection", {
        requestedBy: userId,
        collectionOwner: collection.userId,
      });
      return { success: false, error: "Access denied" };
    }

    // Get all items with artwork and artist info in a single query
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

    const filteredItems = items.filter((item) => item.id !== null);
    const previewImage = items[0]?.artwork?.image || null;

    log.info("Collection retrieved successfully", {
      itemCount: filteredItems.length,
      isPublic: collection.isPublic,
      isOwner,
    });

    return {
      success: true,
      data: {
        ...collection,
        previewImage,
        itemCount: filteredItems.length,
        items: filteredItems,
        isOwner,
      },
    };
  } catch (error) {
    log.error("Failed to get collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to get collection" };
  }
}

/**
 * Get all public collections
 */
export async function getPublicCollections(
  page = 1, 
  pageSize = 20
): Promise<ApiResponse<CollectionWithDetails[]>> {
  const log = logger.child({ 
    operation: "getPublicCollections",
    page,
    pageSize
  });

  log.info("Fetching public collections");

  try {
    const collections = await db
      .select({
        id: userCollections.id,
        name: userCollections.name,
        description: userCollections.description,
        userId: userCollections.userId,
        createdAt: userCollections.createdAt,
        isPublic: userCollections.isPublic,
        user: {
          name: users.name,
        },
      })
      .from(userCollections)
      .innerJoin(users, eq(userCollections.userId, users.id))
      .where(eq(userCollections.isPublic, true))
      .orderBy(desc(userCollections.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    log.debug("Retrieved base public collections", {
      count: collections.length,
    });

    const collectionsWithDetails = await fetchCollectionDetails(collections);

    log.info("Successfully retrieved public collections with details", {
      collectionCount: collectionsWithDetails.length,
    });

    return { success: true, data: collectionsWithDetails };
  } catch (error) {
    log.error("Failed to get public collections", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to get public collections" };
  }
}

/**
 * Update a collection's details
 */
export async function updateCollection(params: {
  userId: string;
  collectionId: number;
  name: string;
  description?: string;
  isPublic: boolean | null;
}): Promise<ApiResponse<CollectionWithDetails>> {
  const log = logger.child({
    operation: "updateCollection",
    userId: params.userId,
    collectionId: params.collectionId,
  });

  log.info("Updating collection", {
    name: params.name,
    isPublic: params.isPublic,
  });

  try {
    // Use transaction to ensure consistent updates
    return await db.transaction(async (tx) => {
      const [collection] = await tx
        .update(userCollections)
        .set({
          name: params.name,
          description: params.description,
          isPublic: params.isPublic,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userCollections.id, params.collectionId),
            eq(userCollections.userId, params.userId),
          ),
        )
        .returning();

      if (!collection) {
        log.warn("Collection not found or user not authorized");
        return { success: false, error: "Collection not found" };
      }

      // Get preview image
      const previewItem = await tx
        .select({
          image: artworks.image,
        })
        .from(collectionItems)
        .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
        .where(eq(collectionItems.collectionId, collection.id))
        .limit(1);

      // Count items
      const countResult = await tx
        .select({ count: sql<string>`count(*)` })
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, collection.id));

      log.info("Collection updated successfully", {
        collectionId: collection.id,
      });

      return {
        success: true,
        data: {
          ...collection,
          previewImage: previewItem[0]?.image || null,
          itemCount: Number(countResult[0]?.count || 0),
        },
      };
    });
  } catch (error) {
    log.error("Failed to update collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to update collection" };
  }
}

/**
 * Helper function to check if a user owns a collection
 */
async function verifyCollectionOwnership(userId: string, collectionId: number): Promise<boolean> {
  const collection = await db
    .select({ id: userCollections.id })
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userId, userId),
      ),
    )
    .limit(1);
  
  return collection.length > 0;
}

/**
 * Add an artwork to a collection
 */
export async function addToCollection(
  userId: string,
  collectionId: number,
  artworkId: number,
): Promise<ApiResponse<void>> {
  const log = logger.child({
    operation: "addToCollection",
    userId,
    collectionId,
    artworkId,
  });

  log.info("Adding artwork to collection");

  try {
    // Check ownership
    const isOwner = await verifyCollectionOwnership(userId, collectionId);
    
    if (!isOwner) {
      log.warn("Collection not found or user not authorized");
      return { success: false, error: "Collection not found" };
    }

    // Use a transaction for consistency
    return await db.transaction(async (tx) => {
      // Check if artwork is already in collection
      const existing = await tx
        .select({ id: collectionItems.id })
        .from(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            eq(collectionItems.artworkId, artworkId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        log.warn("Artwork already exists in collection", { artworkId });
        return { success: false, error: "Artwork already in collection" };
      }

      // Add artwork to collection
      await tx.insert(collectionItems).values({
        collectionId,
        artworkId,
        addedAt: new Date(),
      });

      // Update collection's updatedAt timestamp
      await tx
        .update(userCollections)
        .set({ updatedAt: new Date() })
        .where(eq(userCollections.id, collectionId));

      log.info("Artwork added to collection successfully");
      return { success: true };
    });
  } catch (error) {
    log.error("Failed to add to collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to add to collection" };
  }
}

/**
 * Remove an artwork from a collection
 */
export async function removeFromCollection(
  userId: string,
  collectionId: number,
  artworkId: number,
): Promise<ApiResponse<void>> {
  const log = logger.child({
    operation: "removeFromCollection",
    userId,
    collectionId,
    artworkId,
  });

  log.info("Removing artwork from collection");

  try {
    // Check ownership
    const isOwner = await verifyCollectionOwnership(userId, collectionId);
    
    if (!isOwner) {
      log.warn("Collection not found or user not authorized");
      return { success: false, error: "Collection not found" };
    }

    // Use a transaction for consistency
    return await db.transaction(async (tx) => {
      // Remove the artwork
      const result = await tx
        .delete(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            eq(collectionItems.artworkId, artworkId),
          ),
        )
        .returning();
      
      // Update collection's updatedAt timestamp
      await tx
        .update(userCollections)
        .set({ updatedAt: new Date() })
        .where(eq(userCollections.id, collectionId));

      log.info("Artwork removed from collection successfully", {
        removed: result.length
      });
      return { success: true };
    });
  } catch (error) {
    log.error("Failed to remove from collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to remove from collection" };
  }
}

/**
 * Delete an entire collection and all its items
 */
export async function deleteCollection(
  userId: string,
  collectionId: number,
): Promise<ApiResponse<void>> {
  const log = logger.child({
    operation: "deleteCollection",
    userId,
    collectionId,
  });

  log.info("Deleting collection");

  try {
    // Check ownership first
    const isOwner = await verifyCollectionOwnership(userId, collectionId);
    
    if (!isOwner) {
      log.warn("Collection not found or user not authorized");
      return { success: false, error: "Collection not found" };
    }

    // Use a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // Delete all collection items first
      await tx
        .delete(collectionItems)
        .where(eq(collectionItems.collectionId, collectionId));

      // Then delete the collection itself
      await tx
        .delete(userCollections)
        .where(eq(userCollections.id, collectionId));

      log.info("Collection deleted successfully");
      return { success: true };
    });
  } catch (error) {
    log.error("Failed to delete collection", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { success: false, error: "Failed to delete collection" };
  }
}