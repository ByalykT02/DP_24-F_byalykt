"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Frame, RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchArtworksFromDB } from "~/server/actions/data_fetching/fetch-artworks";
import { motion } from "framer-motion";

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreElementRef = useRef<HTMLDivElement | null>(null);

  const loadArtworks = useCallback(async (page: number = 1, append: boolean = false) => {
    if (loadingRef.current) return;

    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      loadingRef.current = true;
      setError(null);

      const { artworks: data, totalPages, currentPage, hasMore: moreAvailable } = await fetchArtworksFromDB(page);

      if (append) {
        setArtworks(prev => [...prev, ...data]);
      } else {
        setArtworks(data);
      }

      setCurrentPage(currentPage);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Error loading artworks:", error);
      setError("Failed to load artworks. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loadingRef.current) {
      void loadArtworks(currentPage + 1, true);
    }
  }, [hasMore, isLoadingMore, currentPage, loadArtworks]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    void loadArtworks(1, false);
  }, [loadArtworks]);

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
    void loadArtworks();
  }, [loadArtworks]);

  if (error && artworks.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 p-4">
        <div className="space-y-4 text-center">
          <Frame className="mx-auto h-16 w-16 text-red-500" />
          <p className="text-lg font-medium text-gray-900">{error}</p>
          <Button
            onClick={refresh}
            className="bg-primary hover:bg-primary/90"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      {isLoading && <Loading />}

      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Popular Artworks</h1>
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
          {artworks.map((artwork, index) => (
            <motion.div
              key={artwork.contentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={`/artworks/${artwork.contentId}`}
                className="block transition-transform hover:scale-[1.02]"
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
                    <h2 className="line-clamp-1 font-semibold">
                      {artwork.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {artwork.artistName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {artwork.yearAsString}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Loading more artworks...</span>
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
        {!hasMore && artworks.length > 0 && (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">You've reached the end of our collection</p>
          </div>
        )}

        {/* Error Message for Load More */}
        {error && artworks.length > 0 && (
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
