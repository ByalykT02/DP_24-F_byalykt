export interface CollectionWithDetails {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean | null;
  createdAt: Date | null;
  previewImage: string | null;
  itemCount: number;
}

export interface CollectionWithItems extends CollectionWithDetails {
  items: Array<{
    id: number;
    artwork: {
      contentId: number;
      title: string;
      image: string;
      artistName: string;
    };
  }>;
  isOwner: boolean;
}

export interface CreateCollectionParams {
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
}
