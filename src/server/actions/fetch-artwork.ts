import { Artwork, ArtworkDetailed } from "~/lib/types/artwork";

const API_BASE_URL = "https://www.wikiart.org/en";
const MAX_ARTWORKS = 9;

// Configuration for API requests
const REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
  },
  next: { revalidate: 0 }, // Force revalidation on each request
} as const;

// Fallback artwork data remains unchanged
const FALLBACK_ARTWORK: ArtworkDetailed = {
  artistName: "Alphonse Mucha",
  artistUrl: "alphonse-mucha",
  artistContentId: 227598,
  contentId: 227658,
  title: "Holy Mount Athos",
  url: "holy-mount-athos-1926",
  completitionYear: 1926,
  yearAsString: "1926",
  genre: "religious painting",
  style: "Symbolism",
  tags: "priests-and-sacraments, Sky",
  dictionaries: [482, 494],
  sizeX: 480.0,
  sizeY: 405.0,
  diameter: null,
  width: 1983,
  height: 1689,
  material: null,
  technique: null,
  location: null,
  period: null,
  serie: null,
  galleryName: "Mucha Museum, Prague, Czech Republic",
  image: "https://uploads7.wikiart.org/images/alphonse-mucha/holy-mount-athos-1926.jpg",
  auction: null,
  yearOfTrade: null,
  lastPrice: null,
  description: null,
};

// Create a proxy URL for your backend API
const PROXY_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchApi<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // Use proxy endpoint instead of direct WikiArt API
    const response = await fetch(`${PROXY_BASE_URL}/wikiart${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw new Error(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function processArtworkData(artwork: ArtworkDetailed): ArtworkDetailed {
  if (!artwork) {
    return FALLBACK_ARTWORK;
  }
  
  return {
    ...artwork,
    image: artwork.image?.replace(/!(Large|Portrait|Square|PinterestSmall)\.jpg$/, '') || FALLBACK_ARTWORK.image
    // image: artwork.image || FALLBACK_ARTWORK.image

  };
}

export async function fetchArtwork(contentId: string): Promise<ArtworkDetailed> {
  try {
    const artwork = await fetchApi<ArtworkDetailed>(
      `/App/Painting/ImageJson/${contentId}`
    );
    return processArtworkData(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return FALLBACK_ARTWORK;
  }
}