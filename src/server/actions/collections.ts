"use server";

import { db } from "~/server/db";
import { userCollections, collectionItems, artworks, artists, users } from "~/server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

interface CreateCollectionParams {
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
}

export async function createCollection({
  userId,
  name,
  description,
  isPublic,
}: CreateCollectionParams) {
  try {
    const [collection] = await db
      .insert(userCollections)
      .values({
        userId,
        name,
        description,
        isPublic,
      })
      .returning();

    return {
      success: true,
      collection: {
        ...collection,
        itemCount: 0,
      },
    };
  } catch (error) {
    console.error("Failed to create collection:", error);
    return { success: false, error: "Failed to create collection" };
  }
}

export async function getUserCollections(userId: string) {
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

    // Get item count and preview image for each collection
    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        // Get first artwork image as preview
        const previewItem = await db
          .select({
            image: artworks.image,
          })
          .from(collectionItems)
          .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
          .where(eq(collectionItems.collectionId, collection.id))
          .limit(1);

        // Get item count
        const count = await db
          .select({ count: sql`count(*)` })
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          ...collection,
          previewImage: previewItem[0]?.image || null,
          itemCount: Number(count[0]?.count || 0),
        };
      })
    );

    return collectionsWithDetails;
  } catch (error) {
    console.error("Failed to get user collections:", error);
    return [];
  }
}

export async function getCollection(userId: string | null, collectionId: number) {
  try {
    // Get collection with basic info
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
      return null;
    }

    // Check if user has access
    const isOwner = userId === collection[0]?.userId;
    if (!isOwner && !collection[0]?.isPublic) {
      return null;
    }

    // Get collection items with artwork details
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

    return {
      ...collection[0],
      items,
      isOwner,
    };
  } catch (error) {
    console.error("Failed to get collection:", error);
    return null;
  }
}

export async function getPublicCollections() {
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

    // Get preview image and item count for each collection
    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        // Get first artwork image as preview
        const previewItem = await db
          .select({
            image: artworks.image,
          })
          .from(collectionItems)
          .innerJoin(artworks, eq(collectionItems.artworkId, artworks.contentId))
          .where(eq(collectionItems.collectionId, collection.id))
          .limit(1);

        // Get item count
        const count = await db
          .select({ count: sql`count(*)` })
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          ...collection,
          previewImage: previewItem[0]?.image || null,
          itemCount: Number(count[0]?.count || 0),
        };
      })
    );

    return collectionsWithDetails;
  } catch (error) {
    console.error("Failed to get public collections:", error);
    return [];
  }
}

export async function updateCollection({
  userId,
  collectionId,
  name,
  description,
  isPublic,
}: {
  userId: string;
  collectionId: number;
  name: string;
  description?: string;
  isPublic: boolean;
}) {
  try {
    const [collection] = await db
      .update(userCollections)
      .set({
        name,
        description,
        isPublic,
      })
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId)
        )
      )
      .returning();

    return {
      success: true,
      collection,
    };
  } catch (error) {
    console.error("Failed to update collection:", error);
    return { success: false, error: "Failed to update collection" };
  }
}

export async function addToCollection(
  userId: string,
  collectionId: number,
  artworkId: number
) {
  try {
    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId)
        )
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    // Check if artwork already exists in collection
    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.artworkId, artworkId)
        )
      )
      .limit(1);

    if (existing.length) {
      return { success: false, error: "Artwork already in collection" };
    }

    // Add artwork to collection
    await db.insert(collectionItems).values({
      collectionId,
      artworkId,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to add to collection:", error);
    return { success: false, error: "Failed to add to collection" };
  }
}

export async function removeFromCollection(
  userId: string,
  collectionId: number,
  artworkId: number
) {
  try {
    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId)
        )
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.artworkId, artworkId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Failed to remove from collection:", error);
    return { success: false, error: "Failed to remove from collection" };
  }
}

export async function deleteCollection(userId: string, collectionId: number) {
  try {
    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(userCollections)
      .where(
        and(
          eq(userCollections.id, collectionId),
          eq(userCollections.userId, userId)
        )
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    // Delete all items in collection
    await db
      .delete(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));

    // Delete collection
    await db
      .delete(userCollections)
      .where(eq(userCollections.id, collectionId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return { success: false, error: "Failed to delete collection" };
  }
}
