"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { getRecommendations } from "~/server/actions/recommendations";
import { useSession } from "next-auth/react";

interface ArtworkRecommendationsProps {
  excludeIds?: number[];
  limit?: number;
}

export function ArtworkRecommendations({ 
  excludeIds = [], 
  limit = 6 
}: ArtworkRecommendationsProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        const data = await getRecommendations({ 
          userId: session.user.id,
          excludeIds,
          limit
        });
        setRecommendations(data);
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecommendations();
  }, [session?.user?.id, excludeIds, limit]);

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((artwork) => (
        <Link
          key={artwork.contentId}
          href={`/artworks/${artwork.contentId}`}
          className="transition-transform hover:scale-[1.02]"
        >
          <Card className="overflow-hidden">
            <div className="relative aspect-[3/4]">
              <Image
                src={artwork.image}
                alt={artwork.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
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