"use server";
import { WikiArtSearchResult } from "~/lib/types/artwork";
import { fetchWikiArtApi } from "~/server/actions/data_fetching/fetch-api"

export interface SearchResults {
  artworks: {
    contentId: number;
    title: string;
    image: string;
    artistName: string;
    yearAsString: string | null;
    type: "artwork";
  }[];
  artists: {
    contentId: number;
    artistName: string;
    url: string | undefined;
    type: "artist";
  }[];
}

function processSearchResults(results: WikiArtSearchResult[]): SearchResults {
  // Create a Map to store unique artists
  const artistsMap = new Map<
    number,
    { contentId: number; artistName: string; url: string | undefined }
  >();

  // Process artworks and collect unique artists
  const artworks = results.map((result) => {
    // Add artist to map if not already present
    let artistUrl: string | undefined;
    try {
      const urlMatch = result.image.match(/\/images\/([^\/]+)\//) || [];
      artistUrl = urlMatch[1];
    } catch (e) {
      artistUrl = undefined;
    }

    if (!artistsMap.has(result.artistContentId)) {
      artistsMap.set(result.artistContentId, {
        contentId: result.artistContentId,
        artistName: result.artistName,
        url: artistUrl,
      });
    }

    return {
      contentId: result.contentId,
      title: result.title,
      image: result.image.replace("!Large.jpg", ""),
      artistName: result.artistName,
      yearAsString: result.yearAsString,
      type: "artwork" as const,
    };
  });

  // Convert artists map to array
  const artists = Array.from(artistsMap.values()).map((artist) => ({
    ...artist,
    type: "artist" as const,
  }));

  return {
    artworks,
    artists,
  };
}

export async function search(query: string): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return { artworks: [], artists: [] };
  }

  try {
    const searchResults = await fetchWikiArtApi<WikiArtSearchResult[]>(
      `/search/${encodeURIComponent(query)}/1?json=2`,
    );

    // Process and organize the results
    const processedResults = processSearchResults(searchResults);

    // Limit the number of results if needed
    return {
      artworks: processedResults.artworks.slice(0, 5),
      artists: processedResults.artists.slice(0, 5),
    };
  } catch (error) {
    console.error("Search error:", error);
    return { artworks: [], artists: [] };
  }
}
