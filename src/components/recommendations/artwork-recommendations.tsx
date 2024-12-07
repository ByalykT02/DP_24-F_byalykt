"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { getRecommendations } from "~/server/actions/recommendations";


interface ArtworksByArtistProps {
  artistId: number;
  limit?: number;
  artistUrl?: string
}

export function ArtworkRecommendations({ 
  artistId, 
  artistUrl,
  limit = 6 
}: ArtworksByArtistProps) {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArtworks = async () => {
      setIsLoading(true);
      try {
        const data = await getRecommendations({ 
          artistId,
          artistUrl,
          limit
        });
        setArtworks(data);
      } catch (error) {
        console.error("Error loading artworks by artist:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadArtworks();
  }, [artistId, artistUrl, limit]);

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
    );
  }

  if (artworks.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((artwork, index) => (
        <Link
          key={`${artwork.contentId}-${index}`}
          href={`/artworks/${artwork.contentId}`}
          className="transition-transform hover:scale-[1.02]"
        >
          <Card className="overflow-hidden">
            <div className="relative aspect-[3/4]">
              <Image
                src={artwork.image}
                alt={artwork.title || "Artwork"}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                priority
                />
            </div>
            <CardContent className="p-4">
              <h3 className="line-clamp-1 font-semibold">{artwork.title}</h3>
              <p className="text-sm text-muted-foreground">
                {artwork.artist.artistName}
              </p>
              <p className="text-sm text-muted-foreground">
                {artwork.yearAsString}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}