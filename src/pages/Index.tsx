
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AlbumGrid from "@/components/AlbumGrid";
import UploadModal from "@/components/UploadModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogIn } from "lucide-react";
import { mapAlbumsFromDB } from "@/lib/mappers";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAlbumStats } from "@/hooks/useAlbumStats";

const Index = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();
  const { user, isPublicView } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { albumsWithStats, isLoading: isStatsLoading } = useAlbumStats(albums);

  useEffect(() => {
    const fetchAlbums = async () => {
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
          description: "There was an error loading albums.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbums();
  }, [toast]);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleCreateAlbum = async (albumData: Partial<Album>, files: File[]) => {
    try {
      if (!user || !albumData.title) return;
      
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
      
      const mediaItems = await uploadToStorage(files, newAlbum.id);
      
      if (mediaItems.length > 0) {
        const { error: updateError } = await supabase
          .from("albums")
          .update({ cover_url: mediaItems[0].url })
          .eq("id", newAlbum.id);
        
        if (updateError) {
          console.error("Error updating album cover:", updateError);
        }
      }
      
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

  const handleSignIn = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header openUploadModal={user ? openUploadModal : undefined} />
      
      <main className="container max-w-7xl mx-auto px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="py-6 sm:py-8">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3 sm:mb-4">
              Communications Department
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mb-3 sm:mb-4 text-balance">
              VodaPix Gallery
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground text-balance">
              Create, share, and manage your media collections with ease.
            </p>
            
            {!user && isPublicView && (
              <Button 
                onClick={handleSignIn}
                className="mt-5 sm:mt-6 flex items-center space-x-2"
                size={isMobile ? "sm" : "default"}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in to create albums</span>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AlbumGrid albums={isStatsLoading ? albums : albumsWithStats} />
          )}
        </div>
      </main>
      
      {user && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
          onCreateAlbum={handleCreateAlbum}
        />
      )}
    </div>
  );
};

export default Index;
