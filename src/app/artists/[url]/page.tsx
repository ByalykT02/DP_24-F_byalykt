"use client";

import { useCallback, useEffect, useState } from "react";
import { ArtistDetailed } from "~/lib/types/artist";
import { Artwork } from "~/lib/types/artwork";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
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

  const parseBiography = (text: string) => {
    // Split the text into parts based on URL tags
    const parts = text.split(/\[url href=|\/url\]|\[i\]|\[\/i\]/g);
    
    return parts.map((part, index) => {
      if (part.includes(']')) {
        // Handle URL parts
        const [url, label] = part.split(']');
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {label?.slice(0, -1)}
          </a>
        );
      }
      // Return regular text
      return <span key={index}>{part}</span>;
    });
  };
  
  const loadArtistDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchArtistDetails(params.url);
      setArtistData(data);
    } catch (error) {
      console.error("Error loading artist:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Failed to load artist details. Please try again later."
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
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

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Artist Image Section */}
          <div>
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={artist.image}
                  alt={artist.artistName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Card>
          </div>

          {/* Details Section */}
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-8 pr-4">
              <div>
                <h1 className="text-4xl font-bold leading-tight text-gray-900">
                  {artist.artistName}
                </h1>
                {artist.originalArtistName && (
                  <p className="mt-2 text-xl text-gray-600">
                    Originally: {artist.originalArtistName}
                  </p>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {artist.birthDayAsString} - {artist.deathDayAsString}
                  </Badge>
                  {artist.gender && (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      {artist.gender.charAt(0).toUpperCase() + artist.gender.slice(1)}
                    </Badge>
                  )}
                  {artist.wikipediaUrl && (
                    <a
                      href={artist.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="gap-1">
                        <LinkIcon className="h-3 w-3" />
                        Wikipedia
                      </Badge>
                    </a>
                  )}
                </div>
              </div>
          
              {/* Biography */}
              {artist.biography && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <BookOpen className="h-5 w-5" />
                    Biography
                  </h2>
                  <p className="whitespace-pre-line text-gray-600">{parseBiography(artist.biography)}</p>
                </div>
              )}
          
              {/* Periods of Work */}
              {artist.periodsOfWork && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Clock className="h-5 w-5" />
                    Periods of Work
                  </h2>
                  <div className="space-y-2">
                    {artist.periodsOfWork.split('\r\n').map((period) => (
                      <Badge key={period} variant="secondary">
                        {period}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          
              {/* Series */}
              {artist.series && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Grid className="h-5 w-5" />
                    Series
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {artist.series.split('\r\n').map((series) => (
                      <Badge key={series} variant="outline">
                        {series}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          
              <Separator />
          
              {/* Artworks Grid */}
              {artworks.length > 0 && (
                <div>
                  <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
                    <Grid className="h-5 w-5" />
                    Featured Works
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* ... (previous artworks grid code) */}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}