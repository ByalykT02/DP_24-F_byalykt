import { Artwork, ArtworkDetailed } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "./fetch-api";

// Fallback artwork data remains unchanged
const FALLBACK_ARTWORK: ArtworkDetailed = {
  artistUrl: "alphonse-mucha",
  url: "holy-mount-athos-1926",
  dictionaries: [482, 494],
  location: null,
  period: null,
  serie: null,
  genre: "religious painting",
  material: null,
  style: "Symbolism",
  technique: null,
  auction: null,
  yearOfTrade: null,
  lastPrice: null,
  galleryName: "Mucha Museum, Prague, Czech Republic",
  tags: "priests-and-sacraments, Sky",
  description: null,
  title: "Holy Mount Athos",
  contentId: 227658,
  artistContentId: 227598,
  artistName: "Mucha Alphonse",
  completitionYear: 1926,
  yearAsString: "1926",
  width: "1983",
  height: "1689",
  image:
    "https://uploads7.wikiart.org/images/alphonse-mucha/holy-mount-athos-1926.jpg!Large.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// To fetch the detailed artwork data, the custom proxy is needed. Create a proxy URL for your backend API
export async function fetchApi<T>(endpoint: string): Promise<T> {
  const PROXY_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw new Error(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function processArtworkData(artwork: ArtworkDetailed): ArtworkDetailed {
  return {
    ...artwork,

    description:
      artwork.description?.replace(/\[.*?\]/g, "").trim() ||
      FALLBACK_ARTWORK.description,
    image:
      artwork.image?.replace(
        /!(Large|Portrait|Square|PinterestSmall)\.jpg$/,
        "",
      ) || FALLBACK_ARTWORK.image,
  };
}

export async function fetchArtwork(
  contentId: string,
): Promise<ArtworkDetailed> {
  try {
    const artwork = await fetchApi<ArtworkDetailed>(
      `/App/Painting/ImageJson/${contentId}`,
    );

    return processArtworkData(artwork);
    // return artwork;
  } catch (error) {
    console.error("Error fetching artwork:", error);
    return FALLBACK_ARTWORK;
  }
}
