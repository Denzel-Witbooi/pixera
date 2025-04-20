
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AlbumGrid from "@/components/AlbumGrid";
import { Album } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageIcon, LogIn, Plus } from "lucide-react";
import { mapAlbumsFromDB } from "@/lib/mappers";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAlbumStats } from "@/hooks/useAlbumStats";

const Index = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isPublicView, isAdmin } = useAuth();
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

  const handleCreateAlbum = () => {
    navigate("/create-album");
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 animate-fade-in">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="py-6 sm:py-8">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12 sm:mb-16 px-4">
            <div className="mb-6 inline-flex items-center justify-center size-16 rounded-2xl bg-brand/10">
              <ImageIcon className="size-8 text-brand" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Pixera Gallery
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Create, share, and manage your media collections with ease. Bring your memories to life in one beautiful space.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
              {user && isAdmin && (
                <Button 
                  onClick={handleCreateAlbum}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                  size={isMobile ? "lg" : "default"}
                >
                  <Plus className="size-4" />
                  <span>Create New Album</span>
                </Button>
              )}
              
              {!user && (
                <Button 
                  onClick={handleSignIn}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                  variant="outline"
                  size={isMobile ? "lg" : "default"}
                >
                  <LogIn className="size-4" />
                  <span>Sign in to view albums</span>
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin size-8 rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand to-brand-light opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
              </div>
              
              <AlbumGrid albums={isStatsLoading ? albums : albumsWithStats} />
              
              <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-brand-light to-brand opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
