"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { search } from "~/server/actions/search";
import Image from "next/image";
import { useDebounce } from "hooks/use-debounce";

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{
    artworks: Array<{
      contentId: number;
      title: string;
      image: string;
      artistName: string;
      yearAsString: string | null;
      type: 'artwork';
    }>;
    artists: Array<{
      contentId: number;
      artistName: string;
      type: 'artist';
    }>;
  }>({ artworks: [], artists: [] });
  const [isLoading, setIsLoading] = React.useState(false);

  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    const handleSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults({ artworks: [], artists: [] });
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await search(debouncedQuery);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void handleSearch();
  }, [debouncedQuery]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = React.useCallback((item: any) => {
    setOpen(false);
    if (item.type === "artist") {
      router.push(`/artists/${item.artistContentId}`);
    } else {
      router.push(`/artworks/${item.contentId}`);
    }
  }, [router]);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <span className="sr-only">Search artworks and artists</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search artworks and artists..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : query.length < 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              Enter at least 2 characters to search...
            </div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.artists.length > 0 && (
                <CommandGroup heading="Artists">
                  {results.artists.map((artist) => (
                    <CommandItem
                      key={artist.contentId}
                      onSelect={() => handleSelect(artist)}
                      className="flex items-center gap-2"
                    >
                      <span>{artist.artistName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.artworks.length > 0 && (
                <CommandGroup heading="Artworks">
                  {results.artworks.map((artwork) => (
                    <CommandItem
                      key={artwork.contentId}
                      onSelect={() => handleSelect(artwork)}
                      className="flex items-center gap-2"
                    >
                      <div className="relative h-8 w-8 overflow-hidden">
                        <Image
                          src={artwork.image}
                          alt={artwork.title}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span>{artwork.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {artwork.artistName}
                          {artwork.yearAsString && ` (${artwork.yearAsString})`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
