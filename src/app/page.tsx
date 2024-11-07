"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight, Palette, Monitor, Search } from "lucide-react";
import { fetchArtworks } from "~/server/actions/fetch-artwork";
import { Artwork } from "~/lib/types/artwork";
import { Loading } from "~/components/ui/loading";

const MainPage = () => {
  const [results, setResults] = useState<Artwork[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImagesLoaded, setHeroImagesLoaded] = useState(0);

  // Load artworks
  const loadArtworks = useCallback(async () => {
    try {
      const artworks = await fetchArtworks();
      setResults(artworks);
    } catch (error) {
      console.error("Error loading artworks:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  // Handle hero section image loading
  const handleHeroImageLoad = useCallback(() => {
    setHeroImagesLoaded(prev => prev + 1);
  }, []);

  // Update loading state based on initial hero images
  useEffect(() => {
    if (results.length > 0 && heroImagesLoaded >= 1) {
      setIsLoading(false);
    }
  }, [results.length, heroImagesLoaded]);

  // Slide show timer
  useEffect(() => {
    if (results.length === 0) return;

    const timer = setInterval(() => {
      setActiveSlide(current => (current === results.length - 1 ? 0 : current + 1));
    }, 7000);

    return () => clearInterval(timer);
  }, [results.length]);

  const artCategories = [
    {
      id: 1,
      name: "Paintings",
      description: "Explore our collection of stunning paintings",
      icon: <Palette className="mb-4 h-8 w-8 text-primary" />,
      count: 156,
    },
    {
      id: 2,
      name: "Sculptures",
      description: "Discover our diverse range of sculptures",
      icon: <Palette className="mb-4 h-8 w-8 text-primary" />,
      count: 89,
    },
    {
      id: 3,
      name: "Digital Art",
      description: "Experience the latest in digital artwork",
      icon: <Monitor className="mb-4 h-8 w-8 text-primary" />,
      count: 124,
    },
  ];

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="relative h-[80vh] bg-black">
          <div className="absolute inset-0 z-10 bg-black/40" />
          <div className="relative h-full">
            {results.map((artwork, index) => (
              <div
                key={artwork.contentId}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={artwork.image}
                  alt={artwork.title}
                  decoding="sync"
                  loading="eager"
                  fill
                  className="object-cover"
                  onLoad={index === 0 ? handleHeroImageLoad : undefined}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <h1 className="mb-6 text-5xl font-bold text-white">
                  Discover Extraordinary Art
                </h1>
                <p className="mb-8 text-xl text-gray-200">
                  Explore our curated collection of contemporary masterpieces
                </p>
                <div className="flex gap-4">
                  <Button size="lg">
                    Browse Gallery
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Search className="mr-2 h-4 w-4" />
                    Search Art
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Today's focus - {results[0]?.artistName}
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {results.map((artwork, index) => (
                <Card key={artwork.contentId} className="group overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={artwork.image}
                      alt={artwork.title}
                      fill
                      loading={index < 3 ? "eager" : "lazy"}
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      quality={65}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="truncate font-semibold">{artwork.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {artwork.artistName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {artwork.yearAsString}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Explore Art Categories
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {artCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg"
                >
                  <CardContent className="p-6 text-center">
                    {category.icon}
                    <h3 className="mb-2 text-xl font-bold">{category.name}</h3>
                    <p className="mb-4 text-gray-600">{category.description}</p>
                    <p className="mb-4 text-sm text-gray-500">
                      {category.count} pieces
                    </p>
                    <Button
                      variant="outline"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Browse Collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default MainPage;