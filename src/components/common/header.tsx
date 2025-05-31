// src/app/components/Header.tsx
"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { LoginRouteButton } from "./login-route-button";
import { UserMenu } from "./user-menu";
import { useSession } from "next-auth/react";
import { SearchPopover } from "../search/search-commands";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet"; // Import Sheet components

export default function Header() {
  const { data: session, status  } = useSession();
  const userRole = session?.user.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold mx-5">
          GalleryGlobe
        </Link>

        {/* Desktop Navigation */}
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
            href="/categories"
            className="text-sm font-medium hover:text-primary"
          >
            Categories
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium hover:text-primary"
          >
            About
          </Link>

          {userRole === "ADMIN" && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {/* Desktop Search */}
          <div className="relative hidden w-full max-w-sm md:flex">
            <SearchPopover />
          </div>

          {/* User Authentication/Menu */}
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

          {/* Mobile Menu Button (Sheet Trigger) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right"> {/* Sheet slides from the right */}
              <SheetHeader>
                <SheetTitle>GalleryGlobe</SheetTitle>
                <SheetDescription>
                  Explore the world of art.
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {/* Mobile Search - Consider a simpler search input if SearchPopover is complex */}
                <div className="relative w-full">
                  <SearchPopover />
                </div>
                {/* Mobile Navigation Links */}
                <Link
                  href="/artworks"
                  className="text-lg font-medium hover:text-primary"
                >
                  Artworks
                </Link>
                <Link
                  href="/artists"
                  className="text-lg font-medium hover:text-primary"
                >
                  Artists
                </Link>
                <Link
                  href="/categories"
                  className="text-lg font-medium hover:text-primary"
                >
                  Categories
                </Link>
                <Link
                  href="/about"
                  className="text-lg font-medium hover:text-primary"
                >
                  About
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
