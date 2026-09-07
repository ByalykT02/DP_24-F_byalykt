import { logger } from "~/utils/logger";

interface WikiArtAuthSession {
  sessionKey: string;
  expiresAt: number;
}

let authSession: WikiArtAuthSession | null = null;

/** 23h — refresh before the 24h WikiArt session limit. */
export const WIKIART_SESSION_TTL_MS = 23 * 60 * 60 * 1000;

export function clearWikiArtAuthSession(): void {
  authSession = null;
}

export function isWikiArtSessionFresh(
  session: WikiArtAuthSession | null,
  now = Date.now(),
): boolean {
  return !!session && session.expiresAt > now;
}

function getWikiArtCredentials(): { accessCode: string; secretCode: string } {
  // `.env.local` (Vercel pull) provides WIKIART_ACCESS_KEY / WIKIART_SECRET_KEY;
  // older docs referenced WIKIART_ACCESS_CODE / WIKIART_SECRET_CODE. Accept both.
  const accessCode =
    process.env.WIKIART_ACCESS_KEY ?? process.env.WIKIART_ACCESS_CODE ?? "";
  const secretCode =
    process.env.WIKIART_SECRET_KEY ?? process.env.WIKIART_SECRET_CODE ?? "";
  return { accessCode, secretCode };
}

export function buildWikiArtLoginUrl(accessCode: string, secretCode: string): string {
  return (
    "https://www.wikiart.org/en/Api/2/login" +
    `?accessCode=${encodeURIComponent(accessCode)}` +
    `&secretCode=${encodeURIComponent(secretCode)}`
  );
}

export async function getWikiArtAuthSession(): Promise<string> {
  // Check if we have a valid session
  if (isWikiArtSessionFresh(authSession)) {
    return (authSession as WikiArtAuthSession).sessionKey;
  }

  try {
    const { accessCode, secretCode } = getWikiArtCredentials();
    if (!accessCode || !secretCode) {
      throw new Error(
        "Missing WikiArt credentials (WIKIART_ACCESS_KEY / WIKIART_SECRET_KEY)",
      );
    }
    const response = await fetch(buildWikiArtLoginUrl(accessCode, secretCode), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`WikiArt auth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      sessionKey?: string;
      SessionKey?: string;
    };
    // WikiArt returns the key as `SessionKey` (capital S).
    const sessionKey = data.SessionKey ?? data.sessionKey;
    if (!sessionKey) {
      throw new Error("WikiArt auth response missing sessionKey");
    }

    authSession = {
      sessionKey,
      // Set expiration to 23 hours to ensure we refresh before the 24-hour limit
      expiresAt: Date.now() + WIKIART_SESSION_TTL_MS,
    };

    return authSession.sessionKey;
  } catch (error) {
    logger.error("WikiArt authentication error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}