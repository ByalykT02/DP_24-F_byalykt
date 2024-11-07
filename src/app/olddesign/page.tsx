'use client'
import { useEffect, useCallback, useState } from 'react';
import Image from "next/image";
import { fetchArtworks } from '~/server/actions/fetch-artwork';
import { Artwork } from '~/lib/types/artwork';

export default function HomePage() {
  const [results, setResults] = useState<Artwork[]>([]);
    const loadArtworks = useCallback(async () => {
      const artworks = await fetchArtworks();
      setResults(artworks);
      console.log(artworks)
    }, [])
    
    useEffect(() => {
    void loadArtworks();
    }, [loadArtworks])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1 className="text-5xl mb-8">Hello, World!</h1>
      <div className="columns-1 gap-5 lg:gap-8 sm:columns-2 lg:columns-3 xl:columns-4 [&img:not(:first-child)]:mt-5">
        {results.map((item: Artwork, index: number) => (
          <div key={index}>
            <div className="w-full mb-6 h-auto">
              <Image
                width={0}
                height={0}
                sizes="100vw"
                src={item.image}
                className="w-full h-auto"
                priority
                alt={item.title ?? "artwork"}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}