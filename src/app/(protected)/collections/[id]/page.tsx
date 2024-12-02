"use client";

import { useEffect, useState } from "react";
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
  FolderEdit 
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
  removeFromCollection 
} from "~/server/actions/collections";
import { EditCollectionDialog } from "~/components/collections/edit-collection-dialog";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadCollection = async () => {
      if (!session?.user?.id) return;
      
      const data = await getCollection(session.user.id, parseInt(params.id));
      if (!data) {
        router.push("/collections");
        return;
      }
      
      setCollection(data);
      setIsLoading(false);
    };

    void loadCollection();
  }, [session?.user?.id, params.id, router]);

  const handleDelete = async () => {
    if (!session?.user?.id || !collection) return;

    const result = await deleteCollection(session.user.id, collection.id);
    if (result.success) {
      router.push("/collections");
    }
  };

  const handleRemoveArtwork = async (artworkId: number) => {
    if (!session?.user?.id || !collection) return;

    const result = await removeFromCollection(
      session.user.id,
      collection.id,
      artworkId
    );

    if (result.success) {
      setCollection(prev => ({
        ...prev,
        items: prev.items.filter((item: any) => item.artwork.contentId !== artworkId)
      }));
    }
  };

  const handleCollectionUpdated = (updatedCollection: any) => {
    setCollection(prev => ({
      ...prev,
      ...updatedCollection
    }));
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditDialogOpen(true)}
                >
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

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            {collection.isPublic ? (
              <Globe className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          {collection.description && (
            <p className="mt-2 text-muted-foreground">
              {collection.description}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {collection.items.length} {collection.items.length === 1 ? 'artwork' : 'artworks'}
          </p>
        </div>
      </div>

      {/* Artworks Grid */}
      {collection.items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No artworks in this collection</p>
          <Button
            variant="outline"
            onClick={() => router.push("/artworks")}
            className="mt-4"
          >
            Browse Artworks
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map((item: any) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <Link href={`/artworks/${item.artwork.contentId}`}>
                <div className="relative aspect-[3/4]">
                  <Image
                    src={item.artwork.image}
                    alt={item.artwork.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="line-clamp-1 font-semibold">
                    {item.artwork.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.artwork.artistName}
                  </p>
                </CardContent>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemoveArtwork(item.artwork.contentId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <EditCollectionDialog
        collection={collection}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCollectionUpdated={handleCollectionUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}