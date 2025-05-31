"use client";
import { useCallback, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toggleFavorite } from "~/server/actions/user_features/favorites";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "hooks/use-current-user";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface FavoriteButtonProps {
  artworkId: number;
  isFavorite: boolean;
  onToggle: (newState: boolean) => void;
}

export function FavoriteButton({
  artworkId,
  isFavorite,
  onToggle,
}: FavoriteButtonProps) {
  const user = useCurrentUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFavorite = useCallback(async () => {
    // Reset error state
    setError(null);

    // Handle unauthenticated users
    if (!user?.id) {
      router.push("/auth/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await toggleFavorite({ userId: user.id, artworkId });
      
      if (!response.success) {
        throw new Error(response.error ?? "Failed to update favorite status");
      }
      
      onToggle(response.data?.isFavorite!);
    } catch (error) {
      // Type guard for Error objects
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred. Please try again.";
      
      setError(errorMessage);
      
      // Log error for monitoring
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, artworkId, onToggle, router]);

  return (
    <div className="space-y-2">
      <Button
        variant={isFavorite ? "default" : "outline"}
        size="lg"
        onClick={handleToggleFavorite}
        className="min-w-[120px] gap-2"
        disabled={isLoading}
      >
        <Heart 
          className={`h-5 w-5 ${isFavorite ? "fill-current" : ""} ${
            isLoading ? "animate-pulse" : ""
          }`}
        />
        {isLoading 
          ? "Loading..." 
          : isFavorite 
            ? "Favorited" 
            : "Favorite"
        }
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}