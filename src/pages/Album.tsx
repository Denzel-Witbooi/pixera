
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import ViewAlbum from "@/components/ViewAlbum";
import UploadModal from "@/components/UploadModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const AlbumPage = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      try {
        const savedAlbums = localStorage.getItem("vodapix-albums");
        const albums: Album[] = savedAlbums ? JSON.parse(savedAlbums) : [];
        const currentAlbum = albums.find(a => a.id === id);
        
        if (!currentAlbum) {
          setIsLoading(false);
          return;
        }
        
        setAlbum(currentAlbum);
        
        const savedItems = localStorage.getItem("vodapix-media-items");
        const allItems: MediaItem[] = savedItems ? JSON.parse(savedItems) : [];
        const albumItems = allItems.filter(item => item.albumId === id);
        
        setMediaItems(albumItems);
      } catch (error) {
        console.error("Failed to load album data:", error);
        toast({
          title: "Error loading album",
          description: "Failed to load album data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, toast]);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleAddToAlbum = async (albumData: Partial<Album>, files: File[]) => {
    if (!album || !id) return;
    
    try {
      const newMediaItems = await uploadToStorage(files, id);
      
      const savedItems = localStorage.getItem("vodapix-media-items");
      const allItems: MediaItem[] = savedItems ? JSON.parse(savedItems) : [];
      const updatedItems = [...allItems, ...newMediaItems];
      localStorage.setItem("vodapix-media-items", JSON.stringify(updatedItems));
      
      const savedAlbums = localStorage.getItem("vodapix-albums");
      const albums: Album[] = savedAlbums ? JSON.parse(savedAlbums) : [];
      const updatedAlbums = albums.map(a => {
        if (a.id === id) {
          return {
            ...a,
            itemCount: a.itemCount + newMediaItems.length,
            coverUrl: a.coverUrl || (newMediaItems.length > 0 ? newMediaItems[0].url : "")
          };
        }
        return a;
      });
      
      localStorage.setItem("vodapix-albums", JSON.stringify(updatedAlbums));
      
      // Type cast is now unnecessary since uploadToStorage is properly typed
      setMediaItems(prev => [...prev, ...newMediaItems]);
      setAlbum(prev => {
        if (prev) {
          return {
            ...prev,
            itemCount: prev.itemCount + newMediaItems.length,
            coverUrl: prev.coverUrl || (newMediaItems.length > 0 ? newMediaItems[0].url : "")
          };
        }
        return prev;
      });
      
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
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      <Header openUploadModal={openUploadModal} />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Gallery
          </Link>
          
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-medium">{album.title}</h1>
              {album.description && (
                <p className="text-muted-foreground">{album.description}</p>
              )}
            </div>
            
            <Button 
              onClick={openUploadModal}
              variant="outline"
            >
              Add Media
            </Button>
          </div>
        </div>
        
        {mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-xl font-medium text-foreground/80 mb-2">No media in this album</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add some photos or videos to get started.
            </p>
            <Button onClick={openUploadModal}>Add Media</Button>
          </div>
        ) : (
          <ViewAlbum 
            items={mediaItems} 
            albumTitle={album.title}
            onDownload={handleDownloadAlbum}
          />
        )}
      </main>
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCreateAlbum={handleAddToAlbum}
      />
      
      {isDownloading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card shadow-lg rounded-lg p-6 max-w-md w-full text-center">
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
