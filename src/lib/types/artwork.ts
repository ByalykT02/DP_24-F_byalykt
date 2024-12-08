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
  // Artist Information
  artistName: string;
  artistUrl: string;
  artistContentId: number;

  // Artwork Identification
  contentId: number;
  title: string;
  url: string;

  // Creation Details
  completitionYear: number | null;
  yearAsString: string | null;

  // Categorization
  genre: string | null;
  style: string | null;
  tags: string;
  dictionaries: number[];

  // Physical Characteristics
  sizeX: number | null;
  sizeY: number | null;
  diameter: number | null;
  width: number | null;
  height: number | null;
  
  // Materials and Techniques
  material: string | null;
  technique: string | null;

  // Location and Series
  location: string | null;
  period: string | null;
  serie: string | null;
  galleryName: string | null;

  // Image
  image: string | null;

  // Commercial Information
  auction: string | null;
  yearOfTrade: number | null;
  lastPrice: number | null;

  // Optional Fields
  description: string | null;
}