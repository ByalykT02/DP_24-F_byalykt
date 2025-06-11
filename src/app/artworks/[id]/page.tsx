"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { addToHistory } from "~/server/actions/user_features/history";
import { Share2, ArrowLeft, MapPin, Calendar, Tag, Brush } from "lucide-react";
import Image from "next/image";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { fetchArtwork } from "~/server/actions/data_fetching/fetch-artwork";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkIsFavorite } from "~/server/actions/user_features/favorites";
import { FavoriteButton } from "~/components/common/favorite-button";
import { AddToCollectionButton } from "~/components/collections/add-to-collection-button";
import { ArtworkRecommendations } from "~/components/recommendations/artwork-recommendations";
import ShareDialog from "~/components/common/share-dialog";
import { Suspense } from "react";
import ImageViewer from 'react-simple-image-viewer';


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
    setIsFavorite,
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
 * Title section component
 */
const TitleSection = ({
  artwork,
  isFavorite,
  setIsFavorite,
}: {
  artwork: ArtworkDetailed;
  isFavorite: boolean;
  setIsFavorite: (state: boolean) => void;
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

    <div className="flex gap-2">
      <FavoriteButton
        artworkId={artwork.contentId}
        isFavorite={isFavorite}
        onToggle={(newState) => setIsFavorite(newState)}
      />
      <AddToCollectionButton artworkId={artwork.contentId} />
    </div>
  </div>
);

/**
 * Artwork details content section
 */
const DetailsContent = ({
  artwork,
  isFavorite,
  setIsFavorite,
}: {
  artwork: ArtworkDetailed;
  isFavorite: boolean;
  setIsFavorite: (state: boolean) => void;
}) => {
  return (
    <div className="space-y-6 p-6">
      <TitleSection
        artwork={artwork}
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
      />

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

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
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

  // State for react-simple-image-viewer
  const [currentImage, setCurrentImage] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);

  // Fetch artwork data
  const {
    artwork,
    isLoading,
    error,
    isFavorite,
    setIsFavorite,
  } = useArtworkData(params.id, session?.user?.id);

  // Prepare images for the viewer when artwork data is available
  useEffect(() => {
    if (artwork?.image) {
      // simple-image-viewer expects an array of strings
      setViewerImages([artwork.image]);
    } else {
      setViewerImages([]); // Clear images if no artwork or image
    }
  }, [artwork]);


  // Functions for react-simple-image-viewer
  const openImageViewer = useCallback((index: number) => {
    if (viewerImages.length > 0) { // Ensure there's an image to view
      setCurrentImage(index);
      setIsViewerOpen(true);
    }
  }, [viewerImages]); // Include viewerImages in dependencies

  const closeImageViewer = () => {
    setCurrentImage(0); // Reset index when closing
    setIsViewerOpen(false);
  };


  // Handle keyboard events for accessibility (Share dialog and Viewer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isShareDialogOpen) {
          setIsShareDialogOpen(false);
        }
        if (isViewerOpen) {
           closeImageViewer(); // Use the close function
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isShareDialogOpen, isViewerOpen, closeImageViewer]); // Include closeImageViewer here


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

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Image Section - Make it clickable to open viewer */}
          <Card className="mx-auto w-full overflow-hidden bg-black/5 backdrop-blur-sm">
            {/* Add onClick handler to the div containing the Image */}
            {/* Pass the index (0 for a single image) to openImageViewer */}
            <div className="cursor-pointer" onClick={() => openImageViewer(0)}>
              {artwork.image && (
                <Image
                  src={artwork.image}
                  alt={artwork.title || "Artwork"}
                  width={800}
                  height={800}
                  className="object-contain w-full h-auto"
                  loading="eager"
                  priority
                  quality={90}
                />
              )}
            </div>
          </Card>

          <ScrollArea className="h-[calc(100vh-12rem)] lg:h-auto">
            <DetailsContent
              artwork={artwork}
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
            />
          </ScrollArea>
        </div>
      </div>

      {/* Recommendations */}
      <div className="container mx-auto mt-16 px-4">
        <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
        <Suspense fallback={<div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg" />}>
          <ArtworkRecommendations limit={6} artistId={artwork.artistContentId} />
        </Suspense>
      </div>

      {/* react-simple-image-viewer component */}
      {/* Only render if viewerImages has content and isViewerOpen is true */}

      {isViewerOpen && viewerImages.length > 0 && (
        <ImageViewer
          src={viewerImages}
          currentIndex={currentImage}
          disableScroll={false}
          closeOnClickOutside={true}
          onClose={closeImageViewer}
          backgroundStyle={{
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 200
          }}
        />
      )}

    </div>
  );
}
