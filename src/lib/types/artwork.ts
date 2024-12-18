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
  tags: string | null; // Changed from string[] to string
  style: string | null;
  dictionaries: (string | number)[] | null; // Allow both string and number
  width: number | null;
  height: number | null;
  material: string | null;
  technique: string | null;
  location: string | null;
  period: string | null;
  image: string;
  description: string | null;
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