
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ViewAlbum from "@/components/ViewAlbum";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";

// Import our new components
import AlbumHeader from "@/components/album/AlbumHeader";
import EmptyAlbumState from "@/components/album/EmptyAlbumState";
import AlbumDialogs from "@/components/album/AlbumDialogs";
import AlbumNotFound from "@/components/album/AlbumNotFound";
import LoadingState from "@/components/album/LoadingState";

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adapter = useAdapter();

  const { data: album, isLoading: isAlbumLoading } = useQuery<Album | null>({
    queryKey: queryKeys.album(id as string),
    enabled: !!id,
    queryFn: () => adapter.fetchAlbum(id as string),
    meta: {
      onError: () => {
        toast({
          title: "Error loading album",
          description: "Failed to load album data. Please try again.",
          variant: "destructive",
        });
        navigate("/");
      },
    },
  });

  const { data: mediaItems = [], isLoading: isMediaLoading } = useQuery<MediaItem[]>({
    queryKey: queryKeys.media(id as string),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    queryFn: () => adapter.fetchMedia(id as string),
  });

  const isLoading = isAlbumLoading || isMediaLoading;

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const openEditDialog = () => setIsEditDialogOpen(true);
  const closeEditDialog = () => setIsEditDialogOpen(false);

  const openDeleteDialog = () => setIsDeleteDialogOpen(true);
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);

  const handleAddToAlbum = async (albumData: Partial<Album>, files: File[]) => {
    if (!album || !id || !user) return;

    try {
      const newMediaItems = await uploadToStorage(files, id);

      // Optimistically update the media cache
      queryClient.setQueryData<MediaItem[]>(queryKeys.media(id), (prev = []) => [
        ...prev,
        ...newMediaItems,
      ]);

      if (!album.coverUrl && newMediaItems.length > 0) {
        try {
          await adapter.updateAlbumCover(id, newMediaItems[0].url);
          queryClient.setQueryData<Album>(queryKeys.album(id), (prev) =>
            prev ? { ...prev, coverUrl: newMediaItems[0].url } : prev
          );
          queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
        } catch {
          // non-critical — album still works without a cover
        }
      }

      closeUploadModal();

      toast({
        title: "Media added",
        description: `Successfully added ${newMediaItems.length} items to the album.`,
      });
    } catch (error) {
      console.error("Failed to add media to album:", error);
      toast({
        title: "Failed to add media",
        description: "There was an error adding media to your album. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAlbum = async (updatedAlbum: Album) => {
    queryClient.setQueryData(queryKeys.album(id as string), updatedAlbum);
    queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
    toast({
      title: "Album updated",
      description: "The album has been successfully updated.",
    });
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  const isOwner = user && album?.userId === user.id;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!album) {
    return <AlbumNotFound />;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <AlbumHeader
          album={album}
          isOwner={!!isOwner}
          user={user}
          openEditDialog={openEditDialog}
          openDeleteDialog={openDeleteDialog}
          openUploadModal={openUploadModal}
          handleSignIn={handleSignIn}
        />

        {mediaItems.length === 0 ? (
          <EmptyAlbumState
            user={user}
            openUploadModal={openUploadModal}
          />
        ) : (
          <ViewAlbum
            items={mediaItems}
            albumTitle={album?.title || ""}
            isEditable={!!isOwner}
          />
        )}
      </main>

      <AlbumDialogs
        user={user}
        album={album}
        isOwner={!!isOwner}
        isUploadModalOpen={isUploadModalOpen}
        isEditDialogOpen={isEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        closeUploadModal={closeUploadModal}
        closeEditDialog={closeEditDialog}
        closeDeleteDialog={closeDeleteDialog}
        handleAddToAlbum={handleAddToAlbum}
        handleUpdateAlbum={handleUpdateAlbum}
      />
    </div>
  );
};

export default AlbumPage;
