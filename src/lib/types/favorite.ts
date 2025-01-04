import { ArtistDetailed } from "./artist";
import { ArtworkDetailed } from "./artwork";

export interface ToggleFavoriteParams {
  userId: string;
  artworkId: number;
}

export interface ToggleFavorite {
  isFavorite: boolean;
}

export interface UserFavorite {
  id: number;
  createdAt: Date | null;
  artwork: ArtworkDetailed;
  artist: ArtistDetailed;

}
export type UserFavorites = UserFavorite[];

export interface userIntercations {
  id: number;
  userId: string;
  artworkId: number;
  createdAt: Date;
  updatedAt: Date | null;
  rating: number | null;
  comment: string | null;
  isFavorite: boolean;
}
