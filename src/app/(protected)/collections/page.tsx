"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/loading";
import { Plus, FolderPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreateCollectionDialog } from "~/components/collections/create-collection-dialog";
import { getUserCollections } from "~/server/actions/collections";
import { ApiResponse, CollectionWithDetails } from "~/lib/types/collection";

export const dynamic = "force-dynamic";

export default function CollectionsPage() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<CollectionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCollections = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await getUserCollections(session.user.id);

      if (!response.success) {
        setError(response.error ?? "Failed to load collections");
        setCollections([]);
      } else {
        const validCollections = (response.data ?? []).filter(
          (c): c is CollectionWithDetails => c != null,
        );
        setCollections(validCollections);
        setError(null);
      }
    } catch (err) {
      setError("Failed to load collections");
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const handleCollectionCreated = (newCollection: CollectionWithDetails) => {
      setCollections((prev) => {
        const exists = prev.some((c) => c.id === newCollection.id);
        if (exists) {
          return prev.map((c) => (c.id === newCollection.id ? newCollection : c));
        }
        return [...prev, newCollection];
      });
    };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderPlus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">My Collections</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </div>

      <CreateCollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCollectionCreated={handleCollectionCreated}
      />

      {collections.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No collections yet</p>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="mt-4"
            disabled={!session?.user?.id}
          >
            Create your first collection
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection?.id}
              href={`/collections/${collection?.id}`}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-[3/2] bg-muted">
                  {collection.previewImage ? (
                    <Image
                      src={collection.previewImage}
                      alt={collection.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FolderPlus className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="line-clamp-1 font-semibold">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {collection.itemCount}
                    {collection.itemCount === 1 ? " item" : " items"}
                  </p>
                  {collection.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {collection.isPublic ? "Public" : "Private"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
