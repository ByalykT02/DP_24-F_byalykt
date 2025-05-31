"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/loading";
import {
  Plus,
  FolderPlus,
  LayoutList,
  LayoutGrid,
  Globe,
  Lock,
  ChevronRight,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreateCollectionDialog } from "~/components/collections/create-collection-dialog";
import { getUserCollections } from "~/server/actions/user_features/collections";
import { CollectionWithDetails } from "~/lib/types/collection";
import { Input } from "~/components/ui/input";
import { Toggle } from "~/components/ui/toggle";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

export const dynamic = "force-dynamic";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CollectionsPage() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<CollectionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Persist view mode preference in localStorage
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("collectionsViewMode") as "grid" | "list") ??
        "grid"
      );
    }
    return "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");

  const loadCollections = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await getUserCollections(session.user.id);

      if (!response.success) {
        setError(response.error ?? "Failed to load collections");
        setCollections([]);
      } else {
        const validCollections = response.data?.filter(Boolean) ?? [];

        setCollections(validCollections);
        setError(null);
      }
    } catch (err) {
      setError("Failed to load collections");
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    localStorage.setItem("collectionsViewMode", viewMode);
  }, [viewMode]);

  const handleCollectionCreated = (newCollection: CollectionWithDetails) => {
    setCollections((prev) => [newCollection, ...prev]);
    void loadCollections();
  };

  const filteredCollections = collections.filter(
    (collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => void loadCollections()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FolderPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Collections</h1>
            <p className="text-sm text-muted-foreground">
              Organize and manage your favorite artworks
            </p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            pressed={viewMode === "grid"}
            onPressedChange={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === "list"}
            onPressedChange={() => setViewMode("list")}
            aria-label="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Collections Creator */}
      <CreateCollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCollectionCreated={handleCollectionCreated}
      />

      {filteredCollections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <FolderPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">No collections found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Start by creating your first collection"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                className="mt-2"
                disabled={!session?.user?.id}
              >
                Create Collection
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1",
          )}
        >
          {filteredCollections.map((collection) => (
            <motion.div
              key={collection.id}
              variants={item}
              className={cn(viewMode === "list" && "flex items-center gap-4")}
            >
              <Link href={`/collections/${collection.id}`} className="w-full">
                {viewMode === "grid" ? (
                  <Card className="group overflow-hidden transition-transform hover:scale-[1.02]">
                    <CardContent className="p-0">
                      <div className="relative aspect-[1/1] w-full">
                        {collection.previewImage ? (
                          <Image
                            src={collection.previewImage}
                            alt={collection.name}
                            fill
                            sizes="(max-width: 540px) calc(100vw - 16px),
                                (max-width: 800px) 50vw,
                                (max-width: 1024px) 33.18vw,
                                (max-width: 1280px) 278px,
                                calc(12.73vw + 118px)"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <FolderPlus className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="line-clamp-1">
                          {collection.name}
                        </CardTitle>
                        <span className="mt-1 flex shrink-0 items-center text-muted-foreground">
                          {collection.isPublic ? (
                            <Globe className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                      <CardDescription className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {collection.itemCount}
                          {collection.itemCount === 1 ? " item" : " items"}
                        </p>
                        {collection.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {collection.description}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No description
                          </p>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="flex w-full items-center gap-6 rounded-lg border p-4 transition-transform hover:scale-[1.02]">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {collection.previewImage ? (
                        <Image
                          src={collection.previewImage}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FolderPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 text-lg font-semibold">
                          {collection.name}
                        </h3>
                        <span className="flex items-center text-muted-foreground">
                          {collection.isPublic ? (
                            <Globe className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {collection.itemCount}
                          {collection.itemCount === 1 ? " item" : " items"}
                        </span>
                        {collection.description && (
                          <>
                            <span className="text-xs">•</span>
                            <p className="line-clamp-1">
                              {collection.description}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
