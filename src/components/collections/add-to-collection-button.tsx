"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { FolderPlus, Loader2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getUserCollections,
  addToCollection,
} from "~/server/actions/collections";
import { CollectionWithDetails } from "~/lib/types/collection";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { toast } from "hooks/use-toast";

interface AddToCollectionButtonProps {
  artworkId: number;
}

export function AddToCollectionButton({
  artworkId,
}: AddToCollectionButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState<
    number | null
  >(null);

  const handleClick = async () => {
    if (!session?.user?.id) {
      router.push("/auth/login");
      return;
    }

    try {
      setIsDialogOpen(true);
      setIsLoading(true);
      setError(null);

      const response = await getUserCollections(session.user.id);

      if (!response.success) {
        throw new Error(response.error ?? "Failed to load collections");
      }

      const validCollections = response.data ?? [];
      setCollections(validCollections);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load collections. Please try again.";

      setError(errorMessage);
      console.error("Error loading collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: number) => {
    if (!session?.user?.id) return;

    try {
      setIsAddingToCollection(collectionId);
      setError(null);

      const result = await addToCollection(
        session.user.id,
        collectionId,
        artworkId,
      );

      if (!result.success) {
        throw new Error(result.error ?? "Failed to add to collection");
      }

      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Artwork added to collection",
        duration: 3000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add to collection. Please try again.";

      setError(errorMessage);
      console.error("Error adding to collection:", error);
    } finally {
      setIsAddingToCollection(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="gap-2"
        onClick={handleClick}
      >
        <FolderPlus className="h-5 w-5" />
        Add to Collection
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
            <DialogDescription>
              Choose a collection to add this artwork to
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : collections.length === 0 ? (
              <div className="py-8 text-center">
                <FolderPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">
                  You don't have any collections yet
                </p>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    router.push("/collections");
                  }}
                  className="gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={isAddingToCollection === collection.id}
                  >
                    {isAddingToCollection === collection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderPlus className="h-4 w-4" />
                    )}
                    {collection.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
