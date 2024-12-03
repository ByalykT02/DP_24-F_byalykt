export interface Category {
  id: number;
  title: string;
  url: string;
}

export interface CategoryGroup {
  id: number;
  name: string;
  description: string;
  categories: Category[];
}

export enum CategoryType {
  PERIOD = 1,      // Historical periods
  STYLE = 2,       // Art styles and movements
  GENRE = 3,       // Genre/themes
  SCHOOL = 7,      // Art schools and movements
  LOCATION = 8,    // Museums and locations
  AUCTION = 9,     // Auction houses
  NATIONALITY = 10, // Artist nationalities
  MEDIUM = 11,     // Artwork mediums
  MATERIAL = 12,   // Materials used
}