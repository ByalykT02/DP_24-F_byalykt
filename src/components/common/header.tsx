"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { LoginRouteButton } from "./login-route-button";
import { UserMenu } from "./user-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SearchPopover } from "../search/search-commands";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      router.refresh();
    }
  }, [status, router]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          GalleryGlobe
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/artworks"
            className="text-sm font-medium hover:text-primary"
          >
            Artworks
          </Link>
          <Link
            href="/artists"
            className="text-sm font-medium hover:text-primary"
          >
            Artists
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium hover:text-primary"
          >
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="relative hidden w-full max-w-sm md:flex">
            <SearchPopover />
          </div>
          {status === "loading" ? (
            <Button variant="outline" size="sm" disabled>
              Loading...
            </Button>
          ) : session?.user ? (
            <UserMenu email={session.user.email} />
          ) : (
            <LoginRouteButton>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </LoginRouteButton>
          )}
          <Button className="md:hidden" variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
