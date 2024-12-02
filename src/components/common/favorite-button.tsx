"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toggleFavorite } from "~/server/actions/favorites";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "hooks/use-current-user";

interface FavoriteButtonProps {
  artworkId: number;
  initialIsFavorite?: boolean;
}

interface ToggleFavoriteResponse {
  success: boolean;
  isFavorite: boolean;
  error?: string;
}

export function FavoriteButton({ 
  artworkId, 
  initialIsFavorite = false 
}: FavoriteButtonProps) {
  const user = useCurrentUser();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggleFavorite = async () => {
    if (!user?.id) {
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleFavorite(user.id, artworkId) as ToggleFavoriteResponse;
      
      if (result.success && typeof result.isFavorite === 'boolean') {
        setIsFavorite(result.isFavorite);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="lg"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className="gap-2 min-w-[120px]"
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
      {isFavorite ? "Favorited" : "Favorite"}
    </Button>
  );
}