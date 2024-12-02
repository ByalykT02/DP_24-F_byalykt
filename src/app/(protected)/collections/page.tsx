"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/loading";
import { Plus, FolderPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreateCollectionDialog } from "~/components/collections/create-collection-dialog";
import { getUserCollections } from "~/server/actions/collections";

export default function CollectionsPage() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadCollections = async () => {
      if (session?.user?.id) {
        const data = await getUserCollections(session.user.id);
        setCollections(data);
        setIsLoading(false);
      }
    };

    void loadCollections();
  }, [session?.user?.id]);

  const handleCollectionCreated = (newCollection: any) => {
    setCollections((prev) => [...prev, newCollection]);
  };

  if (isLoading) {
    return <Loading />;
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
          >
            Create your first collection
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
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
                    {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
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