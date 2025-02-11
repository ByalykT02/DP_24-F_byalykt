"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Frame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchArtworksFromDB } from "~/server/actions/fetch-artworks";
import { motion } from "framer-motion";

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadingRef = useRef(false);

  const loadArtworks = useCallback(async (page: number = 1) => {
    if (loadingRef.current) return;

    try {
      setIsLoading(true);
      loadingRef.current = true;
      setError(null);

      const {
        artworks: data,
        totalPages: pages,
        currentPage,
      } = await fetchArtworksFromDB(page);
      setArtworks(data);
      setCurrentPage(currentPage);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error loading artworks:", error);
      setError("Failed to load artworks. Please try again.");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  const goToTop = () => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      void loadArtworks(newPage);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 p-4">
        <div className="space-y-4 text-center">
          <Frame className="mx-auto h-16 w-16 text-red-500" />
          <p className="text-lg font-medium text-gray-900">{error}</p>
          <Button
            onClick={() => void loadArtworks()}
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
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => (
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
          ))}
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={() => {
              handlePageChange(currentPage - 1);
              goToTop();
            }}
            disabled={currentPage === 1 || isLoading}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            onClick={() => {
              handlePageChange(currentPage + 1);
              goToTop();
            }}
            disabled={currentPage === totalPages || isLoading}
            variant="outline"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
