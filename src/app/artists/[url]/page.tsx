"use client";

import { useCallback, useEffect, useState } from "react";
import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Loading } from "~/components/ui/loading";
import {
  Share2,
  ArrowLeft,
  Calendar,
  Link as LinkIcon,
  Grid,
  BookOpen,
  Clock,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchArtistDetails } from "~/server/actions/fetch-artist";

interface ArtistPageProps {
  params: {
    url: string;
  };
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const [artistData, setArtistData] = useState<{
    artist: ArtistDetailed;
    artworks: Artwork[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const parseBiography = useCallback((text: string) => {
    if (!text) return null;

    return text
      .split(/\[url href=|\/url\]|\[i\]|\[\/i\]/g)
      .map((part, index) => {
        if (part.includes("]")) {
          const [url, label] = part.split("]");
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {label?.trim().slice(0, label.length - 1) }
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      });
  }, []);

  const loadArtistDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchArtistDetails(params.url);
      console.log(data);
      setArtistData(data);
    } catch (error) {
      console.error("Error loading artist:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load artist details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.url]);

  useEffect(() => {
    void loadArtistDetails();
  }, [loadArtistDetails]);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !artistData) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-600">
            {error || "Artist Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {error
              ? "Please try again later."
              : "The artist you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const { artist, artworks } = artistData;

  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto max-w-7xl px-4 py-8">
          {/* Artist Info Section */}
          <div className="mb-12">
            <div className="grid gap-8 md:grid-cols-[300px,1fr] lg:grid-cols-[400px,1fr]">
              {/* Artist Image */}
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={artist.image!}
                      alt={artist.artistName}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </Card>

                {/* Quick Info */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground">Birth - Death</h2>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {artist.birthDayAsString} - {artist.deathDayAsString}
                      </p>
                    </div>

                    {artist.gender && (
                      <div>
                        <h2 className="text-sm font-medium text-muted-foreground">Gender</h2>
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {artist.gender.charAt(0).toUpperCase() + artist.gender.slice(1)}
                        </p>
                      </div>
                    )}

                    {artist.wikipediaUrl && (
                      <div>
                        <h2 className="text-sm font-medium text-muted-foreground">Links</h2>
                        <a
                          href={artist.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Wikipedia
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Artist Details */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold leading-tight text-gray-900">
                    {artist.artistName}
                  </h1>
                  {artist.originalArtistName && (
                    <p className="mt-2 text-xl text-gray-600">
                      Originally: {artist.originalArtistName}
                    </p>
                  )}
                </div>

                {/* Biography */}
                {artist.biography && (
                  <Card className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                      <BookOpen className="h-5 w-5" />
                      Biography
                    </h2>
                    <div className="prose max-w-none text-gray-600">
                      {parseBiography(artist.biography)}
                    </div>
                  </Card>
                )}

                {/* Career Details */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Periods of Work */}
                  {artist.periodsOfWork && (
                    <Card className="p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                        <Clock className="h-5 w-5" />
                        Periods of Work
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {artist.periodsOfWork.split("\r\n").map((period) => (
                          <Badge key={period} variant="secondary">
                            {period}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Series */}
                  {artist.series && (
                    <Card className="p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                        <Grid className="h-5 w-5" />
                        Series
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {artist.series.split("\r\n").map((series) => (
                          <Badge key={series} variant="outline">
                            {series}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Artworks Section */}
          {artworks.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Featured Works</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {artworks.map((artwork) => (
                  <Link
                    key={artwork.contentId}
                    href={`/artworks/${artwork.contentId}`}
                    className="transition-transform hover:scale-[1.02]"
                  >
                    <Card className="overflow-hidden">
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={artwork.image}
                          alt={artwork.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="line-clamp-1 font-semibold">{artwork.title}</h3>
                        <p className="text-sm text-muted-foreground">{artwork.yearAsString}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }
