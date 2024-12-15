import { env } from "~/env";

interface WikiArtAuthSession {
  sessionKey: string;
  expiresAt: number;
}

let authSession: WikiArtAuthSession | null = null;

export async function getWikiArtAuthSession(): Promise<string> {
  // Check if we have a valid session
  if (authSession && authSession.expiresAt > Date.now()) {
    return authSession.sessionKey;
  }

  try {
    const response = await fetch(
      `https://www.wikiart.org/en/Api/2/login?accessCode=${env.WIKIART_ACCESS_CODE}&secretCode=${env.WIKIART_SECRET_CODE}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WikiArt auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    authSession = {
      sessionKey: data.sessionKey,
      // Set expiration to 23 hours to ensure we refresh before the 24-hour limit
      expiresAt: Date.now() + 23 * 60 * 60 * 1000,
    };

    return authSession.sessionKey;
  } catch (error) {
    console.error("WikiArt authentication error:", error);
    throw error;
  }
}