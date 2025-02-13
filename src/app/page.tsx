"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import Hero from "~/components/home/hero";
import ArtworkTiles from "~/components/home/arwork-tiles";
import { fetchArtworks } from "~/server/actions/fetch-artworks-home";

const MainPage = () => {
  const [results, setResults] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);

  const loadArtworks = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      const artworks = await fetchArtworks();
      setResults(artworks);
    } catch (error) {
      console.error("Error loading artworks:");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Hero artworks={results} />
        <ArtworkTiles artworks={results} />
      </div>
    </>
  );
};

export default MainPage;
