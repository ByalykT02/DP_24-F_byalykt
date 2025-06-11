"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Artist } from "~/lib/types/artist";
import { Loading } from "~/components/ui/loading";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchPopularArtists } from "~/server/actions/data_fetching/fetch-artists";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreElementRef = useRef<HTMLDivElement | null>(null);

  const loadArtists = useCallback(async (page: number = 1, append: boolean = false) => {
    if (loadingRef.current) return;

    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      loadingRef.current = true;
      setError(null);

      const { artists: data, totalPages, currentPage } = await fetchPopularArtists(page);

      if (append) {
        setArtists(prev => [...prev, ...data]);
      } else {
        setArtists(data);
      }

      setCurrentPage(currentPage);
      setHasMore(currentPage < totalPages);
    } catch (error) {
      console.error("Error loading artists:", error);
      setError("Failed to load artists. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loadingRef.current) {
      void loadArtists(currentPage + 1, true);
    }
  }, [hasMore, isLoadingMore, currentPage, loadArtists]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    void loadArtists(1, false);
  }, [loadArtists]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreElementRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observerRef.current.observe(loadMoreElementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  // Initial load
  useEffect(() => {
    void loadArtists();
  }, [loadArtists]);

  if (error && artists.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={refresh}>Try Again</Button>
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
            onClick={refresh}
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

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Loading more artists...</span>
            </div>
          </div>
        )}

        {/* Intersection Observer Target */}
        <div
          ref={loadMoreElementRef}
          className="h-10 w-full"
          style={{ minHeight: '1px' }}
        />

        {/* End of Results Indicator */}
        {!hasMore && artists.length > 0 && (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">You've reached the end of the list</p>
          </div>
        )}

        {/* Error Message for Load More */}
        {error && artists.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="text-center">
              <p className="mb-2 text-red-600 text-sm">{error}</p>
              <Button onClick={loadMore} variant="outline" size="sm">
                Try Loading More
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
