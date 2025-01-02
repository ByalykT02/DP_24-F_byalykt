
export interface Artist{
  contentId: number,
  artistName: string,
  url: string,
  lastNameFirst: string,
  birthDayAsString: string,
  deathDayAsString: string,
  image: string,
  wikipediaUrl: string,
  dictonaries?: number[]
}

export interface ArtistDetailed {
  // Basic Info
  contentId: number;
  artistName: string;
  url: string;
  lastNameFirst: string;
  
  // Dates
  birthDay: string;
  deathDay: string;
  birthDayAsString: string;
  deathDayAsString: string;
  
  // Additional Info
  originalArtistName: string;
  gender: string;
  biography: string;
  story: string;
  
  // Career Details
  activeYearsStart: string | null;
  activeYearsCompletion: string | null;
  series: string;
  themes: string;
  periodsOfWork: string;
  
  // Media
  image: string;
  wikipediaUrl: string;
  
  // Relations
  relatedArtistsIds: number[];
  dictonaries: number[];
}