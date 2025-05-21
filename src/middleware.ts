import { auth } from "auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "routes";

const compiledPublicRoutes = publicRoutes.map(route => new RegExp(route));
const authRoutesSet = new Set(authRoutes);

const MAX_REDIRECTS = 5;

// Directly use the 'auth' object exported from your nextauth.ts
export default auth((req) => {
  try {
    const { nextUrl } = req;
    if (!nextUrl?.pathname) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }

    const redirectCount = parseInt(req.headers.get("x-redirect-count") ?? "0");
    if (redirectCount > MAX_REDIRECTS) {
      return new Response("Too many redirects", { status: 500 });
    }

    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = compiledPublicRoutes.some(route => route.test(nextUrl.pathname));
    const isAuthRoute = authRoutesSet.has(nextUrl.pathname);

    if (isApiAuthRoute) {
      return;
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        try {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        } catch (error) {
          console.error("Redirect error:", error);
          return Response.redirect(new URL("/auth/login", nextUrl));
        }
      }
      return;
    }

    // Handle protected routes
    if (!isLoggedIn && !isPublicRoute) {
      const response = Response.redirect(new URL("/auth/login", nextUrl));
      response.headers.set("x-redirect-count", (redirectCount + 1).toString());
      return response;
    }

    return;
  } catch (error) {
    console.error("Middleware error:", error);
    return Response.redirect(new URL("/auth/login", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
