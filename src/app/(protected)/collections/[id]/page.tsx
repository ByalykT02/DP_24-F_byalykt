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
  LoaderIcon,
  Loader,
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
  getCollection,
  deleteCollection,
  removeFromCollection,
  updateCollection,
} from "~/server/actions/collections";
import { EditCollectionDialog } from "~/components/collections/edit-collection-dialog";
import { CollectionWithDetails } from "~/lib/types/collection";
import { motion } from "framer-motion";
import { Input } from "~/components/ui/input";
import ActionDialog from "~/components/common/action-dialog";
import ShareDialog from "~/components/common/share-dialog";
import { toast } from "hooks/use-toast";

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

// Animation variants for motion effects
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger animation for children
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPublicAlertOpen, setIsPublicAlertOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  // Handle share button click
  const handleShareClick = useCallback(() => {
    if (!collection) return;

    if (!collection.isPublic) {
      setIsPublicAlertOpen(true); // Show public alert
    } else {
      setIsShareDialogOpen(true); // Show share dialog
    }
  }, [collection]);

  // Handle making the collection public
  const handleMakePublic = async () => {
    if (!session?.user?.id || !collection) return;

    try {
      const result = await updateCollection({
        userId: session.user.id,
        collectionId: collection.id,
        name: collection.name,
        description: collection.description ?? "",
        isPublic: true,
      });

      if (result.success) {
        setCollection((prev) => (prev ? { ...prev, isPublic: true } : prev)); // Update collection state
        setIsPublicAlertOpen(false);
        setIsShareDialogOpen(true);
        toast({
          title: "Collection made public",
          description: "Your collection can now be shared with others.",
        });
      } else {
        throw new Error(result.error ?? "Failed to make collection public");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to make collection public",
        variant: "destructive",
      });
    }
  };

  // Filter artworks by search query
  const filteredArtworks = collection?.items.filter(
    (item: any) =>
      item.artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artwork.artistName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Load collection data from server
  const loadCollection = useCallback(async () => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      router.push("/auth/signin"); // Redirect if not signed in
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
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load collection";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, params.id, router, status]);

  // Load collection on component mount
  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);

  // Handle collection deletion
  const handleDelete = async () => {
    if (!session?.user?.id || !collection) return;

    try {
      const result = await deleteCollection(session.user.id, collection.id);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to delete collection");
      }

      toast({
        title: "Collection deleted",
        description: "Your collection has been successfully deleted.",
      });
      router.push("/collections");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete collection";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle artwork removal from the collection
  const handleRemoveArtwork = async (artworkId: number) => {
    if (!session?.user?.id || !collection || isRemoving !== null) return;

    setIsRemoving(artworkId);
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

      toast({
        title: "Artwork removed",
        description: "The artwork has been removed from your collection.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove artwork";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  // Handle collection update
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
      toast({
        title: "Collection updated",
        description: "Your collection has been successfully updated.",
      });
    },
    [],
  );

  // Render loading state
  if (status === "loading" || isLoading) {
    return <Loading />;
  }

  // Redirect unauthenticated users to the sign-in page
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Render error state
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

  // Render empty collection state
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

  // Main component render
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
            onClick={handleShareClick}
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
            type="collection"
            name={collection.name}
            id={collection.id}
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
                  disabled={isRemoving === collectionItem.artwork.contentId}
                >
                  {isRemoving === collectionItem.artwork.contentId ? (
                    <Loader className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
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

      <ActionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onAction={handleDelete}
        title="Delete Collection"
        description="Are you sure you want to delete this collection? This action cannot be undone."
        buttonText="Delete"
      />

      <ActionDialog
        isOpen={isPublicAlertOpen}
        onOpenChange={setIsPublicAlertOpen}
        onAction={handleMakePublic}
        title="Make Collection Public?"
        description="To share this collection, it needs to be public. Would you like to make it public now?"
        buttonText="Make Public"
      />
    </div>
  );
}
