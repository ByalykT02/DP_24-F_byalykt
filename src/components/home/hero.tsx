import { Artwork } from "~/lib/types/artwork";
import Image from "next/image"
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ArrowRight, Search } from "lucide-react";

interface HeroProps {
  artworks: Artwork[];
}

export default function Hero({ artworks }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroImagesLoaded, setHeroImagesLoaded] = useState(0);

  const handleHeroImageLoad = useCallback(() => {
    setHeroImagesLoaded((prev) => prev + 1);
  }, []);
  
  useEffect(() => {
    if (artworks.length === 0) return;

    const timer = setInterval(() => {
      setActiveSlide((current) =>
        current === artworks.length - 1 ? 0 : current + 1,
      );
    }, 7000);

    return () => clearInterval(timer);
  }, [artworks.length]);
  
  return (
  <section className="relative h-[80vh] bg-black">
    <div className="absolute inset-0 z-10 bg-black/40" />
    <div className="relative h-full">
      {artworks.map((artwork, index) => (
        <div
          key={artwork.contentId}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? "opacity-100" : "opacity-0"
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
            Hello World
          </h1>
          <p className="mb-8 text-xl text-gray-200">
            Explore our curated collection of masterpieces
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
  )
}