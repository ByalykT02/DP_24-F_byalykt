"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Settings,
  Share2,
  Trash2,
  ArrowLeft,
  Globe,
  Lock,
  MoreHorizontal,
  FolderEdit,
  Grid,
  Search,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  getCollection,
  deleteCollection,
  removeFromCollection,
} from "~/server/actions/collections";
import { EditCollectionDialog } from "~/components/collections/edit-collection-dialog";
import { CollectionWithDetails } from "~/lib/types/collection";
import { motion } from "framer-motion";
import { Input } from "~/components/ui/input";
import DeleteCollectionDialog from "~/components/common/delete-alert-dialog";
import ShareDialog from "~/components/common/share-dialog";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

interface CollectionItem {
  artwork: {
    contentId: number;
  };
}

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

type CollectionState =
  | (CollectionWithDetails & { items: CollectionItem[] })
  | null;

export default function CollectionPage({ params }: CollectionPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);


  const filteredArtworks = collection?.items.filter(
    (item: any) =>
      item.artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artwork.artistName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const loadCollection = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const collectionId = parseInt(params.id);
      if (isNaN(collectionId)) {
        throw new Error("Invalid collection ID");
      }

      const response = await getCollection(session.user.id, collectionId);

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to load collection");
      }

      setCollection(response.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load collection",
      );
      setCollection(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, params.id]);

  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);

  const handleDelete = async () => {
    if (!session?.user?.id || !collection) return;

    try {
      const result = await deleteCollection(session.user.id, collection.id);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to delete collection");
      }

      router.push("/collections");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete collection",
      );
    }
  };

  const handleRemoveArtwork = async (artworkId: number) => {
    if (!session?.user?.id || !collection) return;

    try {
      const result = await removeFromCollection(
        session.user.id,
        collection.id,
        artworkId,
      );

      if (!result.success) {
        throw new Error(result.error ?? "Failed to remove artwork");
      }

      setCollection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(
            (item) => item.artwork.contentId !== artworkId,
          ),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove artwork");
    }
  };

  const handleCollectionUpdated = useCallback(
    (updatedCollection: Partial<CollectionWithDetails>) => {
      setCollection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updatedCollection,
        };
      });
      setIsEditDialogOpen(false);
    },
    [],
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
            onClick={() => void loadCollection()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Collection not found</p>
          <Link href="/collections">
            <Button variant="outline" className="mt-4">
              Back to Collections
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="absolute -mt-2 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="hidden rounded-lg bg-primary/10 p-2 lg:block">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{collection?.name}</h1>
              {collection?.isPublic ? (
                <Globe className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {collection?.description || "No description"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsShareDialogOpen(true)}
            variant="outline"
            className="gap-2"
            aria-label={`Share collection ${collection.name}`}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <ShareDialog 
            isOpen={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
            collectionName={collection.name}
            collectionId={collection.id}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <FolderEdit className="mr-2 h-4 w-4" />
                Edit Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-72">
        <Input
          placeholder="Search artworks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Artworks Grid */}
      {!filteredArtworks?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Grid className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">No artworks found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Start by adding artworks to this collection"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/artworks")}
                className="mt-2"
              >
                Browse Artworks
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredArtworks.map((collectionItem: any) => (
            <motion.div key={collectionItem.id} variants={item}>
              <Card className="group relative overflow-hidden transition-transform hover:scale-[1.02]">
                <Link href={`/artworks/${collectionItem.artwork.contentId}`}>
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={collectionItem.artwork.image}
                      alt={collectionItem.artwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 font-semibold">
                      {collectionItem.artwork.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {collectionItem.artwork.artistName}
                    </p>
                  </CardContent>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    handleRemoveArtwork(collectionItem.artwork.contentId)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <EditCollectionDialog
        collection={collection}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCollectionUpdated={handleCollectionUpdated}
      />

      <DeleteCollectionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDelete}
        title="Delete Collection"
        description="Are you sure you want to delete this collection? This action cannot be undone."
      />
    </div>
  );
}
