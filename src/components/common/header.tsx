import Link from "next/link";
import { Input } from "~/components/ui/input";
import { Search, Menu } from "lucide-react";
import { Button } from "../ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          GalleryGlobe
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/artworks" className="text-sm font-medium hover:text-primary">
            Artworks
          </Link>
          <Link href="/artists" className="text-sm font-medium hover:text-primary">
            Artists
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search art & artists..."
              className="pl-8 w-[200px] lg:w-[300px]"
            />
          </div>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button className="md:hidden" variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}