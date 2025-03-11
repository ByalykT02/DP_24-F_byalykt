"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { getRecommendations } from "~/server/actions/recommendations";
import type { ArtworkRecommendation } from "~/lib/types/artwork";

interface ArtworkRecommendationsProps {
  artistId: number;
  limit?: number;
}

export function ArtworkRecommendations({ 
  artistId, 
  limit = 6 
}: ArtworkRecommendationsProps) {
  const [artworks, setArtworks] = useState<ArtworkRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getRecommendations({ artistId, limit });
      setArtworks(data);
    } catch (err) {
      setError("Failed to load artwork recommendations");
      console.error("Error loading artwork recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [artistId, limit]);

  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  if (artworks.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((artwork) => (
        <Link
          key={artwork.contentId}
          href={`/artworks/${artwork.contentId}`}
          className="transition-transform hover:scale-[1.02]"
        >
          <Card className="overflow-hidden h-full">
            <div className="relative aspect-[3/4]">
              <Image
                src={artwork.image}
                alt={artwork.title || "Artwork"}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                priority={false}
                quality={80}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="line-clamp-1 font-semibold">{artwork.title}</h3>
              <p className="text-sm text-muted-foreground">
                {artwork.artist.artistName}
              </p>
              {artwork.yearAsString && (
                <p className="text-sm text-muted-foreground">
                  {artwork.yearAsString}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}