"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchArtworks } from "~/server/actions/fetch-artwork";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import ArtCategories from "~/components/home/art-categories";
import Hero from "~/components/home/hero";
import ArtworkTiles from "~/components/home/arwork-tiles";

const MainPage = () => {
  const [results, setResults] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);

  // Load artworks
  const loadArtworks = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      const artworks = await fetchArtworks();
      setResults(artworks);
      console.log(artworks[0]?.artistName);
    } catch (error) {
      console.error("Error loading artworks:", error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);



  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Hero artworks={results}/>

        <ArtworkTiles artworks={results}/>

        <ArtCategories />
        
      </div>
    </>
  );
};

export default MainPage;
