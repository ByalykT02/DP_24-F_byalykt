"use client";

import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { search, SearchResults } from "~/server/actions/user_features/search";
import Image from "next/image";
import { useDebounce } from "hooks/use-debounce";
import { useCallback, useEffect, useState } from "react";

export function SearchPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ artworks: [], artists: [] });
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(open ? query : "", 300);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ artworks: [], artists: [] });
    }
  }, [open]);

  useEffect(() => {
    const handleSearch = async () => {
      if (!open || debouncedQuery.length < 2) {
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
  }, [debouncedQuery, open]);

  const handleSelect = useCallback(
    (item: any) => {
      setOpen(false);
      if (item.type === "artist") {
        router.push(`/artists/${item.url}`);
      } else {
        router.push(`/artworks/${item.contentId}`);
      }
    },
    [router]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        >
          <SearchIcon className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex">Search...</span>
          <span className="sr-only">Search artworks and artists</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] xl:w-[500px]">
        <Input
          placeholder="Search artworks and artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : query.length < 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              Enter at least 2 characters to search...
            </div>
          ) : (
            <div className="space-y-4">
              {results.artists.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Artists</h3>
                  <ul className="mt-1 space-y-1">
                    {results.artists.map((artist) => (
                      <li
                        key={artist.contentId}
                        className="cursor-pointer hover:bg-muted p-2 rounded"
                        onClick={() => handleSelect(artist)}
                      >
                        {artist.artistName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.artworks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Artworks</h3>
                  <ul className="mt-1 space-y-1">
                    {results.artworks.map((artwork) => (
                      <li
                        key={artwork.contentId}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                        onClick={() => handleSelect(artwork)}
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
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
