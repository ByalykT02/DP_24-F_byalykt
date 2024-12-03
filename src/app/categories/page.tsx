"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CategoryGroup } from "~/lib/types/category";
import { getAllCategories } from "~/server/actions/fetch-categories";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const groups = await getAllCategories();
        setCategoryGroups(groups);
        console.log(groups[0])
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategories();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Browse Art Categories</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {categoryGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {group.categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${group.id}/${category.url}`}
                    className="group flex items-center justify-between rounded-md p-2 hover:bg-accent"
                  >
                    <span>{category.title}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
                {group.categories.length > 6 && (
                  <Button
                    variant="ghost"
                    className="mt-2 w-full justify-start text-primary"
                    asChild
                  >
                    <Link href={`/categories/${group.id}`}>
                      View all {group.categories.length} categories
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}