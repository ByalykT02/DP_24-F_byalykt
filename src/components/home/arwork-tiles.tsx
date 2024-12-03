import { useState } from "react";
import { Artwork } from "~/lib/types/artwork";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface ArtworkTilesProps {
  artworks: Artwork[];
}

export default function ArtworkTiles({ artworks }: ArtworkTilesProps) {
  // Track loading state for each image
  const [imageStates, setImageStates] = useState<Record<string, {
    loading: boolean;
    error: boolean;
    retries: number;
  }>>({});

  const MAX_RETRIES = 3;
  
  const handleImageLoad = (artworkId: number) => {
    setImageStates(prev => ({
      ...prev,
      [artworkId]: { loading: false, error: false, retries: 0 }
    }));
  };

  const handleImageError = (artworkId: number) => {
    setImageStates(prev => {
      const currentState = prev[artworkId] || { loading: false, error: false, retries: 0 };
      const newRetries = currentState.retries + 1;
      
      return {
        ...prev,
        [artworkId]: {
          loading: false,
          error: newRetries >= MAX_RETRIES,
          retries: newRetries
        }
      };
    });
  };

  const retryImage = (artworkId: number) => {
    setImageStates(prev => ({
      ...prev,
      [artworkId]: { loading: true, error: false, retries: 0 }
    }));
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Today's focus - {artworks[0]?.artistName}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork, index) => (
            <Link 
              key={artwork.contentId} 
              href={`/artworks/${artwork.contentId}`}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-[3/4]">
                  {imageStates[artwork.contentId]?.error ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <p className="mb-2 text-sm text-gray-500">Failed to load image</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            retryImage(artwork.contentId);
                          }}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(!imageStates[artwork.contentId] || imageStates[artwork.contentId]?.loading) && (
                        <div className="absolute inset-0">
                          <Skeleton className="h-full w-full" />
                        </div>
                      )}
                      <Image
                        src={artwork.image}
                        alt={artwork.title}
                        fill
                        loading={index < 3 ? "eager" : "lazy"}
                        className={`object-cover transition-opacity duration-300 ${
                          imageStates[artwork.contentId]?.loading ? 'opacity-0' : 'opacity-100'
                        }`}
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        quality={65}
                        onLoadStart={() => {
                          if (!imageStates[artwork.contentId]) {
                            setImageStates(prev => ({
                              ...prev,
                              [artwork.contentId]: { loading: true, error: false, retries: 0 }
                            }));
                          }
                        }}
                        onLoad={() => handleImageLoad(artwork.contentId)}
                        onError={() => handleImageError(artwork.contentId)}
                      />
                    </>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="truncate font-semibold">{artwork.title}</h3>
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
      </div>
    </section>
  );
}