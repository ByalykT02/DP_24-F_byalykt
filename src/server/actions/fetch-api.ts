import { getWikiArtAuthSession } from "~/lib/wikiart-auth";

export async function fetchWikiArtApi<T>(endpoint: string): Promise<T> {
  const sessionKey = await getWikiArtAuthSession();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = new URL(`https://www.wikiart.org/en${endpoint}`);
    // Add auth session key to URL
    url.searchParams.append("authSessionKey", sessionKey);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ArtGalleryBot/1.0)",
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
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}