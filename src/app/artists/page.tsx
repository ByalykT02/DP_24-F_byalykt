"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Artist } from "~/lib/types/artist";
import { Loading } from "~/components/ui/loading";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchPopularArtists } from "~/server/actions/fetch-artists";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadArtists = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      setIsLoading(true);
      loadingRef.current = true;
      setError(null);
      const data = await fetchPopularArtists();
      setArtists(data);
    } catch (error) {
      console.error("Error loading artists:", error);
      setError("Failed to load artists. Please try again.");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadArtists();
  }, [loadArtists]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={() => void loadArtists()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      {isLoading && <Loading />}
      
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Popular Artists</h1>
          <Button
            onClick={() => void loadArtists()}
            variant="outline"
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Link
              key={artist.contentId}
              href={`/artists/${artist.url}`}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={artist.image}
                    alt={artist.artistName}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <CardContent className="p-4">
                  <h2 className="font-semibold line-clamp-1">{artist.artistName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {artist.birthDayAsString} - {artist.deathDayAsString}
                  </p>
                  {artist.wikipediaUrl && (
                    <a 
                      href={artist.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Wikipedia
                    </a>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}