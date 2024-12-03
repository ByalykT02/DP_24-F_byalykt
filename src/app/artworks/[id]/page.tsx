"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { addToHistory } from "~/server/actions/history";

import {
  Share2,
  ArrowLeft,
  Eye,
  MapPin,
  Calendar,
  Tag,
  Brush,
  Ruler,
} from "lucide-react";
import Image from "next/image";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { fetchArtwork } from "~/server/actions/fetch-artwork";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkIsFavorite } from "~/server/actions/favorites";
import { FavoriteButton } from "~/components/common/favorite-button";
import { AddToCollectionButton } from "~/components/collections/add-to-collection-button";
import { ArtworkRecommendations } from "~/components/recommendations/artwork-recommendations";

interface ArtworkPageProps {
  params: {
    id: string;
  };
}

export default function ArtworkPage({ params }: ArtworkPageProps) {
  const [artwork, setArtwork] = useState<ArtworkDetailed>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const loadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyAddedRef = useRef(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const { data: session } = useSession();

  const router = useRouter();

  const calculateImageDimensions = useCallback(
    (originalWidth: number, originalHeight: number) => {
      if (!containerRef.current) return { width: 0, height: 0 };

      const containerWidth = containerRef.current.offsetWidth;
      const maxHeight = Math.min(window.innerHeight * 0.7, 800);
      const aspectRatio = originalWidth / originalHeight;

      let width = containerWidth;
      let height = containerWidth / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }

      return { width, height };
    },
    [],
  );

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (session?.user?.id) {
        const status = await checkIsFavorite(
          session.user.id,
          Number(params.id),
        );
        setIsFavorite(status);
      }
    };

    void checkFavoriteStatus();
  }, [session?.user?.id, params.id]);

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setIsLoading(true);
        const artworkData = await fetchArtwork(params.id);
        setArtwork(artworkData);

        if (session?.user?.id && !historyAddedRef.current) {
          await addToHistory(session.user.id, artworkData);
          historyAddedRef.current = true;
        }

        if (artworkData.width && artworkData.height) {
          const dimensions = calculateImageDimensions(
            artworkData.width,
            artworkData.height,
          );
          setImageDimensions(dimensions);
        }
      } catch (error) {
        console.error("Error loading artwork:", error);
        setError("Failed to load artwork. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadArtwork();
  }, [params.id, calculateImageDimensions, session?.user?.id]);

  useEffect(() => {
    historyAddedRef.current = false;
  }, [params.id]);

  // Recalculate dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (artwork?.width && artwork?.height) {
        const dimensions = calculateImageDimensions(
          artwork.width,
          artwork.height,
        );
        setImageDimensions(dimensions);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [artwork, calculateImageDimensions]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full lg:aspect-[3/4]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-600">
            {error || "Artwork Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {error
              ? "Please try again later."
              : "The artwork you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Section */}
          <div ref={containerRef} className="relative">
            <Card
              className={`overflow-hidden bg-black/5 backdrop-blur-sm ${isImageZoomed ? "fixed inset-4 z-50 flex items-center justify-center bg-black/90" : ""}`}
            >
              <div
                className={`relative flex items-center justify-center ${isImageZoomed ? "h-full w-full" : ""}`}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
              >
                {artwork.image && (
                  <Image
                    src={artwork.image}
                    alt={artwork.title || "Artwork"}
                    width={
                      isImageZoomed
                        ? (artwork.width ?? 800)
                        : imageDimensions.width || 800
                    }
                    height={
                      isImageZoomed
                        ? (artwork.height ?? 600)
                        : imageDimensions.height || 600
                    }
                    className={`object-contain transition-transform duration-200 ${
                      isImageZoomed ? "max-h-full max-w-full" : ""
                    }`}
                    priority
                  />
                )}
              </div>
              <div className="border-t bg-white/80 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="gap-1">
                      <Ruler className="h-3 w-3" />
                      {artwork.width} x {artwork.height}
                    </Badge>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsImageZoomed(!isImageZoomed)}
                  >
                    <Eye className="h-4 w-4" />
                    {isImageZoomed ? "Exit Fullscreen" : "View Fullscreen"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Details Section */}
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-8 pr-4">
              <div>
                <h1 className="text-4xl font-bold leading-tight text-gray-900">
                  {artwork.title}
                </h1>
                <h2 className="mt-2 text-2xl text-gray-600">
                  by {artwork.artistName}
                </h2>
              </div>
              <div className="flex gap-2">
                <FavoriteButton artworkId={artwork.contentId} />
                <AddToCollectionButton artworkId={artwork.contentId} />
              </div>
              <div className="flex flex-wrap gap-2">
                {artwork.style && (
                  <Badge variant="secondary" className="gap-1">
                    <Brush className="h-3 w-3" />
                    {artwork.style}
                  </Badge>
                )}
                {artwork.yearAsString && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {artwork.yearAsString}
                  </Badge>
                )}
                {artwork.location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {artwork.location}
                  </Badge>
                )}
              </div>

              {artwork.description && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="mb-3 font-semibold">Description</h3>
                  <p className="text-gray-600">{artwork.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {artwork.genre && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="mb-2 font-medium text-gray-500">Genre</h4>
                      <p>{artwork.genre}</p>
                    </div>
                  )}
                  {artwork.technique && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="mb-2 font-medium text-gray-500">
                        Technique
                      </h4>
                      <p>{artwork.technique}</p>
                    </div>
                  )}
                  {artwork.material && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="mb-2 font-medium text-gray-500">
                        Material
                      </h4>
                      <p>{artwork.material}</p>
                    </div>
                  )}
                  {artwork.period && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="mb-2 font-medium text-gray-500">Period</h4>
                      <p>{artwork.period}</p>
                    </div>
                  )}
                </div>
              </div>

              {artwork.tags && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {artwork.tags.split(",").map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="gap-1 bg-gray-50"
                        >
                          <Tag className="h-3 w-3" />
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      <div className="container mx-auto mt-16 px-4">
        <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
        <ArtworkRecommendations excludeIds={[Number(params.id)]} limit={6} />
      </div>
    </div>
  );
}
