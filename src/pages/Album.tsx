
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ViewAlbum from "@/components/ViewAlbum";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapAlbumFromDB, mapMediaItemsFromDB } from "@/lib/mappers";

// Import our new components
import AlbumHeader from "@/components/album/AlbumHeader";
import EmptyAlbumState from "@/components/album/EmptyAlbumState";
import AlbumDialogs from "@/components/album/AlbumDialogs";
import AlbumNotFound from "@/components/album/AlbumNotFound";
import LoadingState from "@/components/album/LoadingState";

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        const { data: albumData, error: albumError } = await supabase
          .from("albums")
          .select("*")
          .eq("id", id)
          .single();
        
        if (albumError) {
          throw albumError;
        }
        
        if (!albumData) {
          navigate("/");
          return;
        }
        
        setAlbum(mapAlbumFromDB(albumData));
        
        const { data: mediaData, error: mediaError } = await supabase
          .from("media_items")
          .select("*")
          .eq("album_id", id)
          .order("created_at", { ascending: true });
        
        if (mediaError) {
          throw mediaError;
        }
        
        setMediaItems(mapMediaItemsFromDB(mediaData || []));
      } catch (error) {
        console.error("Failed to load album data:", error);
        toast({
          title: "Error loading album",
          description: "Failed to load album data. Please try again.",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumData();
  }, [id, navigate, toast]);

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
      
      setMediaItems(prev => [...prev, ...newMediaItems]);
      
      if (!album.coverUrl && newMediaItems.length > 0) {
        const { error: updateError } = await supabase
          .from("albums")
          .update({ cover_url: newMediaItems[0].url })
          .eq("id", id);
        
        if (!updateError) {
          setAlbum(prev => {
            if (prev) {
              return {
                ...prev,
                coverUrl: newMediaItems[0].url
              };
            }
            return prev;
          });
        }
      }
      
      closeUploadModal();
      
      toast({
        title: "Media added",
        description: `Successfully added ${newMediaItems.length} items to the album.`
      });
    } catch (error) {
      console.error("Failed to add media to album:", error);
      toast({
        title: "Failed to add media",
        description: "There was an error adding media to your album. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAlbum = async (updatedAlbum: Album) => {
    if (!album) return;
    
    setAlbum(updatedAlbum);
    toast({
      title: "Album updated",
      description: "The album has been successfully updated."
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
