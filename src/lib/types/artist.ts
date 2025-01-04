export interface Artist {
  contentId: number;
  artistName: string;
  url: string;
  lastNameFirst: string;
  birthDayAsString: string;
  deathDayAsString: string;
  image: string;
  wikipediaUrl: string;
  dictonaries?: number[];
}

export interface ArtistDetailed {
  contentId: number;
  artistName: string;
  url: string | null;
  lastNameFirst: string | null;
  birthDay: string | null;
  deathDay: string | null;
  birthDayAsString: string | null;
  deathDayAsString: string | null;
  originalArtistName: string | null;
  gender: string | null;
  biography: string | null;
  story: string | null;
  activeYearsStart: string | null;
  activeYearsCompletion: string | null;
  series: string | null;
  themes: string | null;
  periodsOfWork: string | null;
  image: string | null;
  wikipediaUrl: string | null;

  relatedArtistsIds?: number[];
  dictonaries?: number[];
  createdAt: Date | null;
  updatedAt: Date | null;
}
