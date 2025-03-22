
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AlbumGrid from "@/components/AlbumGrid";
import UploadModal from "@/components/UploadModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { mapAlbumsFromDB } from "@/lib/mappers";

const Index = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("albums")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setAlbums(mapAlbumsFromDB(data || []));
      } catch (error) {
        console.error("Error fetching albums:", error);
        toast({
          title: "Failed to load albums",
          description: "There was an error loading your albums.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbums();
  }, [user, toast]);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleCreateAlbum = async (albumData: Partial<Album>, files: File[]) => {
    try {
      if (!user || !albumData.title) return;
      
      // Insert the album first to get an ID
      const { data: newAlbum, error: albumError } = await supabase
        .from("albums")
        .insert({
          title: albumData.title,
          description: albumData.description || "",
          created_at: new Date().toISOString(),
          user_id: user.id
        })
        .select()
        .single();
      
      if (albumError || !newAlbum) {
        throw albumError || new Error("Failed to create album");
      }
      
      // Upload files
      const mediaItems = await uploadToStorage(files, newAlbum.id);
      
      // Update album with cover URL
      if (mediaItems.length > 0) {
        const { error: updateError } = await supabase
          .from("albums")
          .update({ cover_url: mediaItems[0].url })
          .eq("id", newAlbum.id);
        
        if (updateError) {
          console.error("Error updating album cover:", updateError);
        }
      }
      
      // Refetch albums to update the list
      const { data: updatedAlbums, error: fetchError } = await supabase
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!fetchError) {
        setAlbums(mapAlbumsFromDB(updatedAlbums || []));
      }
      
      closeUploadModal();
      
      toast({
        title: "Album created",
        description: `Successfully created "${albumData.title}" with ${mediaItems.length} items.`
      });
    } catch (error) {
      console.error("Failed to create album:", error);
      toast({
        title: "Failed to create album",
        description: "There was an error creating your album. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header openUploadModal={openUploadModal} />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="py-8">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              Communications Department
            </span>
            <h1 className="text-4xl font-medium tracking-tight sm:text-5xl mb-4">
              VodaPix Gallery
            </h1>
            <p className="text-lg text-muted-foreground">
              Create, share, and manage your media collections with ease.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AlbumGrid albums={albums} />
          )}
        </div>
      </main>
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCreateAlbum={handleCreateAlbum}
      />
    </div>
  );
};

export default Index;
