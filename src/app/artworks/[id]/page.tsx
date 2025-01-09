"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { addToHistory } from "~/server/actions/history";
import { Share2, ArrowLeft, MapPin, Calendar, Tag, Brush } from "lucide-react";
import Image from "next/image";
import { ArtworkDetailed } from "~/lib/types/artwork";
import { fetchArtwork } from "~/server/actions/fetch-artwork";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkIsFavorite } from "~/server/actions/favorites";
import { FavoriteButton } from "~/components/common/favorite-button";
import { AddToCollectionButton } from "~/components/collections/add-to-collection-button";
import { ArtworkRecommendations } from "~/components/recommendations/artwork-recommendations";
import { AnimatePresence, motion } from "framer-motion";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import ShareDialog from "~/components/common/share-dialog";

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

const useImageOrientation = (artwork?: ArtworkDetailed) => {
  const [isHorizontal, setIsHorizontal] = useState(false);

  useEffect(() => {
    if (artwork?.width && artwork?.height) {
      const aspectRatio = Number(artwork.width) / Number(artwork.height);
      setIsHorizontal(aspectRatio > 1);
    }
  }, [artwork?.width, artwork?.height]);

  return isHorizontal;
};

// Components
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

const ImageControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex w-1/4 flex-row justify-between">
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => zoomIn()}
      >
        Zoom In
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => zoomOut()}
      >
        Zoom Out
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => resetTransform()}
      >
        Reset
      </Button>
    </div>
  );
};

const ImageViewer = ({ artwork }: { artwork: ArtworkDetailed }) => (
  <Card className="mx-auto max-w-6xl overflow-hidden bg-black/5 backdrop-blur-sm">
    <TransformWrapper>
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative flex h-full justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {artwork.image && (
            <TransformComponent>
              <Image
                src={artwork.image}
                alt={artwork.title || "Artwork"}
                width={Number(artwork.width) ?? 1200}
                height={Number(artwork.height) ?? 800}
                className="object-contain"
                priority
                sizes="90vw"
              />
            </TransformComponent>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="border-t bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="gap-1">
            {artwork.width} x {artwork.height}
          </Badge>

          <ImageControls />
        </div>
      </div>
    </TransformWrapper>
  </Card>
);

// Custom hooks
const useArtworkData = (id: string, userId?: string) => {
  const [artwork, setArtwork] = useState<ArtworkDetailed>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const historyAddedRef = useRef(false);

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setIsLoading(true);
        const artworkData = await fetchArtwork(id);
        setArtwork(artworkData);

        if (userId && !historyAddedRef.current) {
          await addToHistory(userId, artworkData);
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

  return { artwork, isLoading, error };
};

const TitleSection = ({
  artwork,
  isFavorite,
  setIsFavorite,
  isHorizontal,
}: {
  artwork: ArtworkDetailed;
  isFavorite: boolean;
  setIsFavorite: (state: boolean) => void;
  isHorizontal: boolean;
}) => (
  <div className="flex items-start justify-between">
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        {artwork.title}
      </h1>
      <h2 className="cursor-pointer text-xl text-gray-600 transition-colors hover:text-gray-900">
        {artwork.artistName}
      </h2>
    </div>
    {isHorizontal && (
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
    <div className={`space-y-8 ${isHorizontal ? "py-8" : "p-8"}`}>
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
        className={`grid gap-6 ${isHorizontal ? "grid-cols-4" : "sm:grid-cols-2"}`}
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

const useImageDimensions = (artwork?: ArtworkDetailed) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current || !artwork?.width || !artwork?.height) return;

    const containerWidth = containerRef.current.offsetWidth;
    const maxHeight = Math.min(window.innerHeight * 0.7, 800);
    const aspectRatio = Number(artwork.width) / Number(artwork.height);

    let width = containerWidth;
    let height = containerWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    setDimensions({ width, height });
  }, [artwork?.width, artwork?.height]);

  useEffect(() => {
    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);
    return () => window.removeEventListener("resize", calculateDimensions);
  }, [calculateDimensions]);

  return { containerRef, dimensions };
};

// Main component
export default function ArtworkPage({ params }: ArtworkPageProps) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const { artwork, isLoading, error } = useArtworkData(
    params.id,
    session?.user?.id,
  );
  const { containerRef, dimensions } = useImageDimensions(artwork);

  const isHorizontal = useImageOrientation(artwork);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (session?.user?.id) {
        const status = await checkIsFavorite(
          session.user.id,
          Number(params.id),
        );
        setIsFavorite(status.data?.isFavorite!);
      }
    };

    void checkFavoriteStatus();
  }, [session?.user?.id, params.id]);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageZoomed) {
        setIsImageZoomed(false);
      }
      if (e.key === "Escape" && isShareDialogOpen) {
        setIsShareDialogOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageZoomed]);

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
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
  }

  if (error || !artwork) {
    return (
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
            onClick={() => router.back()}
            className="mt-4"
            aria-label="Go back to previous page"
          >
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
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleShare}
            aria-label="Share artwork"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <ShareDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          type="artwork"
          name={artwork.title}
          id={artwork.contentId}
        />

        {isHorizontal ? (
          <div className="space-y-8">
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
              <div className="max-w-6xl">
                <ImageViewer artwork={artwork} />
              </div>
            </div>

            <ScrollArea className="h-auto">
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
          // Vertical Layout (unchanged)
          <div className="grid gap-12 lg:grid-cols-2">
            <div ref={containerRef} className="relative">
              <ImageViewer artwork={artwork} />
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
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

      <div className="container mx-auto mt-16 px-4">
        <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
        <ArtworkRecommendations limit={6} artistId={artwork.artistContentId} />
      </div>
    </div>
  );
}
