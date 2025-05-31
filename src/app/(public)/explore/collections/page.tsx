"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Loading } from "~/components/ui/loading";
import { FolderPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublicCollections } from "~/server/actions/user_features/collections";

export default function ExploreCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      const data = await getPublicCollections();
      setCollections(data.data ?? []);
      console.log(data.data)
      setIsLoading(false);
    };

    void loadCollections();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore Collections</h1>
        <p className="mt-2 text-muted-foreground">
          Discover curated collections from the community
        </p>
      </div>

      {collections.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No public collections available</p>
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
                    By {collection.user.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
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