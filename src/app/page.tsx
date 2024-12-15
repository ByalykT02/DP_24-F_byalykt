"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import ArtCategories from "~/components/home/art-categories";
import Hero from "~/components/home/hero";
import ArtworkTiles from "~/components/home/arwork-tiles";
import { fetchArtworks } from "~/server/actions/fetch-artworks-home";
import { processArtworksToDb } from "~/server/actions/process-artworks";

const MainPage = () => {
  const [results, setResults] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
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
      {showAnnouncement && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-500 ease-in-out">
          <div className="animate-scale-up mx-4 max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-transform duration-500 ease-in-out">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">
              Announcement!
            </h3>
            <p className="mb-4 text-gray-600">
              I am sorry to say that, but web application
              "GalleryGlobe" cannot function properly. Right now, the API
              provider, WikiArt, is under the attack, and therefore blocked all
              the access to it's API. Due to that situation, you can't fetch new
              data nor load images. I am sorry for that
            </p>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* {isLoading && <Loading />} */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Hero artworks={results} />
        <ArtworkTiles artworks={results} />
        <ArtCategories />
      </div>
    </>
  );
};

export default MainPage;
