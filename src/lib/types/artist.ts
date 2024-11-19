
export interface Artist{
  contentId: number,
  artistName: string,
  url: string,
  lastNameFirst: string,
  birthDayAsString: string,
  deathDayAsString: string,
  image: string,
  wikipediaUrl: string,
  dictonaries: number[]
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
/*
{
        "contentId": 184856,
        "artistName": "Jackson Pollock",
        "url": "jackson-pollock",
        "lastNameFirst": "Pollock Jackson ",
        "birthDay": "/Date(-1828051200000)/",
        "deathDay": "/Date(-422582400000)/",
        "birthDayAsString": "January 28, 1912",
        "deathDayAsString": "August 11, 1956",
        "image": "https://uploads3.wikiart.org/images/paul-jackson-pollock.jpg!Portrait.jpg",
        "wikipediaUrl": "http://en.wikipedia.org/wiki/Jackson_Pollock",
        "dictonaries": [
            324,
            347,
            1368,
            15877,
            8512
        ]
        }, */