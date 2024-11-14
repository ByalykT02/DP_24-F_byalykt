import { Artwork } from "~/lib/types/artwork";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

interface ArtworkTilesProps {
  artworks: Artwork[];
}

export default function ArtworkTiles({ artworks}: ArtworkTilesProps){
  return (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="mb-12 text-center text-3xl font-bold">
        Today's focus - {artworks[0]?.artistName}
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, index) => (
          <Card key={artwork.contentId} className="group overflow-hidden hover:scale-105 transition-transform">
            <div className="relative aspect-[3/4]">
              <Image
                src={artwork.image}
                alt={artwork.title}
                fill
                loading={index < 3 ? "eager" : "lazy"}
                className="object-cover"
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
  )
}
