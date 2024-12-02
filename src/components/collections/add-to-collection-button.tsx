"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FolderPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserCollections, addToCollection } from "~/server/actions/collections";

interface AddToCollectionButtonProps {
  artworkId: number;
}

export function AddToCollectionButton({ artworkId }: AddToCollectionButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleClick = async () => {
    if (!session?.user?.id) {
      router.push("/auth/login");
      return;
    }

    setIsDialogOpen(true);
    setIsLoading(true);
    const userCollections = await getUserCollections(session.user.id);
    setCollections(userCollections);
    setIsLoading(false);
  };

  const handleAddToCollection = async (collectionId: number) => {
    if (!session?.user?.id) return;

    const result = await addToCollection(
      session.user.id,
      collectionId,
      artworkId
    );

    if (result.success) {
      setIsDialogOpen(false);
      // Optionally show a success toast
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">
                  You don't have any collections yet
                </p>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    router.push("/collections");
                  }}
                >
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleAddToCollection(collection.id)}
                  >
                    <FolderPlus className="h-4 w-4" />
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