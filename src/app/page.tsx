"use client";
import React from "react";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";
import Hero from "~/components/home/hero";
import ArtworkTiles from "~/components/home/arwork-tiles";
import { fetchArtworks } from "~/server/actions/data_fetching/fetch-artworks-home";
import useSWR from "swr";

const MainPage = () => {
  const { 
    data: artworks, 
    isLoading, 
    error 
  } = useSWR<Artwork[]>('artworks', fetchArtworks, {
    revalidateOnFocus: false,
    dedupingInterval: 60 * 1000,
    onError: (error) => {
      console.error("Error loading artworks:", error);
    }
  });

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {error ? (
          <div className="text-center text-red-600 p-4">
            Failed to load artworks. Please try again later.
          </div>
        ) : (
          <>
            <Hero artworks={artworks ?? []} />
            <ArtworkTiles artworks={artworks ?? []} />
          </>
        )}
      </div>
    </>
  );
};

export default MainPage;