export interface Artwork {
  title: string,
  contentId: number,
  artistContentId: number,
  artistName: string,
  completitionYear: number,
  yearAsString: string,
  width: number,
  image: string,
  height: number
}

export interface ArtworkDetailed {
  contentId: number;
  artistContentId: number;
  artistName: string;
  artistUrl: string | null;
  title: string;
  url: string | null;
  completitionYear: number | null;
  yearAsString: string | null;
  genre: string | null;
  style: string | null;
  tags: string | null; // Match database type
  dictionaries: any | null; // Allow JSON storage
  width: string | null;
  height: string | null;
  material: string | null;
  technique: string | null;
  location: string | null;
  period: string | null;
  serie: string | null;
  galleryName: string | null;
  auction: string | null;
  yearOfTrade: number | null;
  lastPrice: string | null; // Match database type
  image: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WikiArtSearchResult {
  title: string;
  contentId: number;
  artistContentId: number;
  artistName: string;
  completitionYear: number | null;
  yearAsString: string | null;
  width: number;
  image: string;
  height: number;
}