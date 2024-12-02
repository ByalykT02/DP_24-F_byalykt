"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/loading";
import { Heart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { clearFavorites, getFavorites } from "~/server/actions/favorites";

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (session?.user?.id) {
        const data = await getFavorites(session.user.id);
        setFavorites(data);
        setIsLoading(false);
      }
    };

    void loadFavorites();
  }, [session?.user?.id]);

  const handleClearFavorites = async () => {
    if (!session?.user?.id) return;

    const result = await clearFavorites(session.user.id);
    if (result.success) {
      setFavorites([]);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Favorites</h1>
        </div>
        {favorites.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleClearFavorites}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Favorites
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No favorites yet</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <Link
              key={item.id}
              href={`/artworks/${item.artwork.contentId}`}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={item.artwork.image}
                    alt={item.artwork.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="line-clamp-1 font-semibold">
                    {item.artwork.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.artist.artistName}
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