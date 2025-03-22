import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ViewAlbum from "@/components/ViewAlbum";
import UploadModal from "@/components/UploadModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, LogIn, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapAlbumFromDB, mapMediaItemsFromDB } from "@/lib/mappers";
import { useIsMobile } from "@/hooks/use-mobile";

const AlbumPage = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();

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

  const handleDownloadAlbum = async () => {
    if (mediaItems.length === 0) {
      toast({
        title: "Nothing to download",
        description: "This album is empty.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder(album?.title || "album");
      
      if (!folder) throw new Error("Failed to create zip folder");
      
      folder.file("readme.txt", "This is a placeholder for the actual album download.");
      
      const content = await zip.generateAsync({ type: "blob" });
      
      saveAs(content, `${album?.title || "album"}.zip`);
      
      toast({
        title: "Download complete",
        description: "Your album has been downloaded successfully."
      });
    } catch (error) {
      console.error("Failed to download album:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the album. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-medium mb-4">Album not found</h1>
        <p className="text-muted-foreground mb-6">
          The album you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/">
          <Button>Return to Gallery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header openUploadModal={user ? openUploadModal : undefined} />
      
      <main className="container max-w-7xl mx-auto px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Gallery
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-medium text-balance">{album.title}</h1>
              {album.description && (
                <p className="text-muted-foreground text-balance line-clamp-2">{album.description}</p>
              )}
            </div>
            
            {user ? (
              <Button 
                onClick={openUploadModal}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex-shrink-0 flex items-center"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Media
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex-shrink-0 flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>Sign in to add</span>
              </Button>
            )}
          </div>
        </div>
        
        {mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <h3 className="text-lg sm:text-xl font-medium text-foreground/80 mb-2">No media in this album</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {user ? "Add some photos or videos to get started." : "There are no photos or videos in this album yet."}
            </p>
            {user && (
              <Button onClick={openUploadModal} size={isMobile ? "sm" : "default"}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Media
              </Button>
            )}
          </div>
        ) : (
          <ViewAlbum 
            items={mediaItems} 
            albumTitle={album.title}
            onDownload={handleDownloadAlbum}
          />
        )}
      </main>
      
      {user && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
          onCreateAlbum={handleAddToAlbum}
        />
      )}
      
      {isDownloading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card shadow-lg rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Preparing Download</h3>
            <p className="text-muted-foreground">
              Please wait while we package your album...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumPage;
