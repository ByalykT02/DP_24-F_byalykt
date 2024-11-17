"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import {
  Share2,
  ArrowLeft,
  Eye,
  MapPin,
  Calendar,
  Tag,
  Brush,
} from "lucide-react";
import Image from "next/image";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { fetchArtwork } from "~/server/actions/fetch-artwork";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  const loadArtwork = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setError(null);
      const artworkData = await fetchArtwork(params.id);
      setArtwork(artworkData);
    } catch (error) {
      console.error("Error loading artwork:", error);
      setError("Failed to load artwork. Please try again later.");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [params.id]);

  useEffect(() => {
    void loadArtwork();
  }, [loadArtwork]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Error Loading Artwork
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => void loadArtwork()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-semibold">Artwork Not Found</h2>
            <p className="text-muted-foreground">
              The artwork you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
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

        <div className="grid gap-8 md:grid-cols-2">
          {/* Image Section */}
          <div className="relative">
            <Card className="overflow-hidden">
              <div
                className={`relative aspect-[3/4] transition-transform duration-300 ${isImageZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
              >
                {artwork.image && (
                  <Image
                    src={artwork.image}
                    alt={artwork.title || "Artwork"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    priority
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4 gap-2 bg-white/80 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageZoomed(!isImageZoomed);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {isImageZoomed ? "Zoom Out" : "Zoom In"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Details Section */}
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-6 pr-4">
              <div>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                  {artwork.title}
                </h1>
                <h2 className="mt-2 text-xl text-gray-600">
                  by {artwork.artistName}
                </h2>
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
                <div>
                  <h3 className="mb-2 font-semibold">Description</h3>
                  <p className="text-gray-600">{artwork.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {artwork.genre && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Genre
                      </h4>
                      <p>{artwork.genre}</p>
                    </div>
                  )}
                  {artwork.technique && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Technique
                      </h4>
                      <p>{artwork.technique}</p>
                    </div>
                  )}
                  {artwork.material && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Material
                      </h4>
                      <p>{artwork.material}</p>
                    </div>
                  )}
                </div>
              </div>

              {artwork.tags && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 font-semibold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {artwork.tags.split(",").map((tag) => (
                        <Badge key={tag} variant="outline" className="gap-1">
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
    </div>
  );
}
