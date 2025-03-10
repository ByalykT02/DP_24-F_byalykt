"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { addToHistory } from "~/server/actions/history";
import { Share2, ArrowLeft, MapPin, Calendar, Tag, Brush, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import Image from "next/image";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { fetchArtwork } from "~/server/actions/fetch-artwork";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkIsFavorite } from "~/server/actions/favorites";
import { FavoriteButton } from "~/components/common/favorite-button";
import { AddToCollectionButton } from "~/components/collections/add-to-collection-button";
import { ArtworkRecommendations } from "~/components/recommendations/artwork-recommendations";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ShareDialog from "~/components/common/share-dialog";
import { Suspense } from "react";
import { cn } from "~/lib/utils";

// Types
interface DetailCardProps {
  title: string;
  content: string | null;
  icon?: React.ReactNode;
}

interface ArtworkPageProps {
  params: {
    id: string;
  };
}

/**
 * Custom hook to fetch and manage artwork data
 */
const useArtworkData = (id: string, userId?: string) => {
  const [artwork, setArtwork] = useState<ArtworkDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const historyAddedRef = useRef(false);

  // Fetch artwork data
  useEffect(() => {
    const loadArtwork = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await fetchArtwork(parseInt(id, 10));
        
        if (!response.success || !response.data) {
          setError(response.error || "Failed to load artwork");
          return;
        }
        
        setArtwork(response.data);

        // Add to history if logged in
        if (userId && !historyAddedRef.current) {
          await addToHistory(userId, response.data);
          historyAddedRef.current = true;
        }
      } catch (err) {
        console.error("Error loading artwork:", err);
        setError("Failed to load artwork. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadArtwork();
    
    return () => {
      historyAddedRef.current = false;
    };
  }, [id, userId]);

  // Check if artwork is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!userId || !id) return;
      
      try {
        const response = await checkIsFavorite(userId, Number(id));
        if (response.success && response.data) {
          setIsFavorite(response.data.isFavorite);
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      }
    };

    void checkFavoriteStatus();
  }, [userId, id]);

  return { 
    artwork, 
    isLoading, 
    error,
    isFavorite,
    setIsFavorite
  };
};

/**
 * Hook to determine artwork orientation and calculate optimal dimensions
 */
const useArtworkLayout = (artwork: ArtworkDetailed | null) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Determine if artwork is horizontal or vertical
  const isHorizontal = useMemo(() => {
    if (!artwork?.width || !artwork?.height) return true;
    const artWidth = parseFloat(String(artwork.width));
    const artHeight = parseFloat(String(artwork.height));
    return artWidth > artHeight;
  }, [artwork?.width, artwork?.height]);

  // Calculate optimal dimensions based on viewport and container
  const calculateDimensions = useCallback(() => {
    if (!containerRef.current || !artwork?.width || !artwork?.height) return;

    const containerWidth = containerRef.current.offsetWidth;
    const maxHeight = Math.min(window.innerHeight * 0.7, 800);
    
    const artWidth = parseFloat(String(artwork.width));
    const artHeight = parseFloat(String(artwork.height));
    const aspectRatio = artWidth / artHeight;

    let width = containerWidth;
    let height = containerWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    setDimensions({ width, height: height + 56 });
  }, [artwork?.width, artwork?.height]);

  // Recalculate on resize or artwork change
  useEffect(() => {
    calculateDimensions();
    
    const handleResize = () => {
      calculateDimensions();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateDimensions]);

  return { 
    containerRef, 
    dimensions, 
    isHorizontal 
  };
};

/**
 * Detail card component for artwork metadata
 */
const DetailCard = ({ title, content, icon }: DetailCardProps) => {
  if (!content) return null;

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-500">
        {icon}
        {title}
      </h4>
      <p className="text-gray-700">{content}</p>
    </div>
  );
};

/**
 * Image controls component (zoom in, out, reset)
 */
const ImageControls = ({ zoomIn, zoomOut, resetTransform }: any) => {
  return (
    <div className="flex gap-x-2">
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => zoomIn()}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
        <span className="hidden sm:inline">Zoom In</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => zoomOut()}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
        <span className="hidden sm:inline">Zoom Out</span>
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => resetTransform()}
        aria-label="Reset zoom"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
    </div>
  );
};

/**
 * Image viewer component with zoom functionality
 */
const ImageViewer = ({ artwork }: { artwork: ArtworkDetailed }) => {
  if (!artwork.image) return null;
  
  const width = Number(artwork.width) || 1200;
  const height = Number(artwork.height) || 800;
  
  return (
    <Card className="mx-auto max-w-6xl overflow-hidden bg-black/5 backdrop-blur-sm">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        limitToBounds={true}
        wheel={{ step: 0.05 }}
        doubleClick={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="relative flex h-full justify-center">
              <TransformComponent wrapperClass="w-full" contentClass="w-full">
                <Image
                  src={artwork.image}
                  alt={artwork.title || "Artwork"}
                  width={width}
                  height={height}
                  className="object-contain"
                  loading="eager"
                  priority
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                />
              </TransformComponent>
            </div>

            <div className="border-t bg-white/80 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary" className="h-full">
                  {artwork.width} × {artwork.height}
                </Badge>

                <ImageControls 
                  zoomIn={zoomIn}
                  zoomOut={zoomOut}
                  resetTransform={resetTransform}
                />
              </div>
            </div>
          </>
        )}
      </TransformWrapper>
    </Card>
  );
};

/**
 * Title section component
 */
const TitleSection = ({
  artwork,
  isFavorite,
  setIsFavorite,
  isHorizontal,
  showButtons = true
}: {
  artwork: ArtworkDetailed;
  isFavorite: boolean;
  setIsFavorite: (state: boolean) => void;
  isHorizontal: boolean;
  showButtons?: boolean;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="space-y-2">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
        {artwork.title}
      </h1>
      <h2 className="cursor-pointer text-xl text-gray-600 transition-colors hover:text-gray-900">
        {artwork.artistName}
      </h2>
    </div>
    
    {showButtons && isHorizontal && (
      <div className="flex gap-2">
        <FavoriteButton
          artworkId={artwork.contentId}
          isFavorite={isFavorite}
          onToggle={(newState) => setIsFavorite(newState)}
        />
        <AddToCollectionButton artworkId={artwork.contentId} />
      </div>
    )}
  </div>
);

/**
 * Artwork details content section
 */
const DetailsContent = ({
  artwork,
  isFavorite,
  setIsFavorite,
  isHorizontal,
  showTitle = true,
}: {
  artwork: ArtworkDetailed;
  isFavorite: boolean;
  setIsFavorite: (state: boolean) => void;
  isHorizontal: boolean;
  showTitle?: boolean;
}) => {
  return (
    <div className={cn("space-y-6", isHorizontal ? "py-6" : "p-6")}>
      {showTitle && (
        <TitleSection
          artwork={artwork}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          isHorizontal={isHorizontal}
        />
      )}

      {/* Only show buttons in vertical layout */}
      {!isHorizontal && (
        <div className="flex gap-2">
          <FavoriteButton
            artworkId={artwork.contentId}
            isFavorite={isFavorite}
            onToggle={(newState) => setIsFavorite(newState)}
          />
          <AddToCollectionButton artworkId={artwork.contentId} />
        </div>
      )}

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

      <div
        className={cn(
          "grid gap-6", 
          isHorizontal 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
            : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        <DetailCard
          title="Genre"
          content={artwork.genre}
          icon={<Tag className="h-4 w-4" />}
        />
        <DetailCard
          title="Technique"
          content={artwork.technique}
          icon={<Brush className="h-4 w-4" />}
        />
        <DetailCard
          title="Material"
          content={artwork.material}
          icon={<Tag className="h-4 w-4" />}
        />
        <DetailCard
          title="Period"
          content={artwork.period}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      {artwork.tags && (
        <>
          <Separator />
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {artwork.tags.split(",").map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 bg-gray-50">
                  <Tag className="h-3 w-3" />
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Loading skeleton component
 */
const ArtworkSkeleton = () => (
  <div className="container mx-auto max-w-7xl px-4 py-8">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full lg:aspect-[3/4]" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error state component
 */
const ErrorState = ({ error, onBack }: { error: string | null; onBack: () => void }) => (
  <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
    <Card className="max-w-md p-6 text-center">
      <h2 className="mb-2 text-xl font-semibold text-red-600">
        {error || "Artwork Not Found"}
      </h2>
      <p className="text-gray-600">
        {error
          ? "Please try again later."
          : "The artwork you're looking for doesn't exist or has been removed."}
      </p>
      <Button
        onClick={onBack}
        className="mt-4"
        aria-label="Go back to previous page"
      >
        Go Back
      </Button>
    </Card>
  </div>
);

/**
 * Main component
 */
export default function ArtworkPage({ params }: ArtworkPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  // Fetch artwork data
  const { 
    artwork, 
    isLoading, 
    error, 
    isFavorite, 
    setIsFavorite 
  } = useArtworkData(params.id, session?.user?.id);
  
  // Calculate layout based on artwork dimensions
  const { containerRef, dimensions, isHorizontal } = useArtworkLayout(artwork);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isShareDialogOpen) {
        setIsShareDialogOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isShareDialogOpen]);

  // Loading state
  if (isLoading) {
    return <ArtworkSkeleton />;
  }

  // Error state
  if (error || !artwork) {
    return <ErrorState error={error} onBack={() => router.back()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Navigation and sharing */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="gap-2"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsShareDialogOpen(true)}
            aria-label="Share artwork"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {/* Share dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          type="artwork"
          name={artwork.title}
          id={artwork.contentId}
        />

        {/* Horizontal layout */}
        {isHorizontal ? (
          <div className="space-y-6">
            <TitleSection
              artwork={artwork}
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
              isHorizontal={true}
            />

            <div
              ref={containerRef}
              className="relative flex w-full justify-center bg-gray-50"
            >
              <ImageViewer artwork={artwork} />
            </div>

            <ScrollArea 
              className="rounded-lg border bg-background shadow-sm"
              style={{ height: Math.max(300, dimensions.height) }}
            >
              <DetailsContent
                artwork={artwork}
                isFavorite={isFavorite}
                setIsFavorite={setIsFavorite}
                isHorizontal={true}
                showTitle={false}
              />
            </ScrollArea>
          </div>
        ) : (
          // Vertical Layout
          <div className="grid gap-8 lg:grid-cols-2">
            <div ref={containerRef} className="relative">
              <ImageViewer artwork={artwork} />
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)]">
              <DetailsContent
                artwork={artwork}
                isFavorite={isFavorite}
                setIsFavorite={setIsFavorite}
                isHorizontal={false}
              />
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="container mx-auto mt-16 px-4">
        <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
        <Suspense fallback={<div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg" />}>
          <ArtworkRecommendations limit={6} artistId={artwork.artistContentId} />
        </Suspense>
      </div>
    </div>
  );
}