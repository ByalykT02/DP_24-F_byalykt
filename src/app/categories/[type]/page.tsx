"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Category, CategoryType } from "~/lib/types/category";
import { getCategoryDetails } from "~/server/actions/fetch-categories";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CategoryGroupPageProps {
  params: {
    type: string;
  };
}

export default function CategoryPage({ params }: CategoryGroupPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategoryGroup = async () => {
      try {
        const typeId = parseInt(params.type);
        // const details = await getCategoryDetails(typeId, params.slug);
        // setCategory(details);
        
        // Here you would also fetch artworks for this category
        // using your existing artwork fetching logic
        
      } catch (error) {
        console.error("Error loading category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryGroup();
  }, [params.type]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-8 text-3xl font-bold">{category.title}</h1>

      {/* <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork) => (
          <Link
            key={artwork.id}
            href={`/artworks/${artwork.id}`}
            className="transition-transform hover:scale-[1.02]"
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-[3/4]">
                <Image
                  src={artwork.image}
                  alt={artwork.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{artwork.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {artwork.artistName}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div> */}
    </div>
  );
}