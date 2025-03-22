
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AlbumGrid from "@/components/AlbumGrid";
import UploadModal from "@/components/UploadModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Album, MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { uploadToStorage } = useImageUpload();
  const { toast } = useToast();

  useEffect(() => {
    // This would normally fetch data from Supabase
    // For now, we'll load from localStorage if available
    const savedAlbums = localStorage.getItem("vodapix-albums");
    if (savedAlbums) {
      try {
        setAlbums(JSON.parse(savedAlbums));
      } catch (error) {
        console.error("Failed to parse albums from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Save to localStorage when albums change
    localStorage.setItem("vodapix-albums", JSON.stringify(albums));
  }, [albums]);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleCreateAlbum = async (albumData: Partial<Album>, files: File[]) => {
    try {
      if (!albumData.id) return;
      
      // Upload files (this is a mock function for now)
      const mediaItems = await uploadToStorage(files, albumData.id);
      
      // Save media items to localStorage (this would be a Supabase insert in a real app)
      const savedItems = localStorage.getItem("vodapix-media-items");
      const allItems: MediaItem[] = savedItems ? JSON.parse(savedItems) : [];
      const updatedItems = [...allItems, ...mediaItems];
      localStorage.setItem("vodapix-media-items", JSON.stringify(updatedItems));
      
      // Create album with cover image
      const coverUrl = mediaItems.length > 0 ? mediaItems[0].url : "";
      const newAlbum: Album = {
        id: albumData.id,
        title: albumData.title || "Untitled Album",
        description: albumData.description || "",
        coverUrl,
        createdAt: albumData.createdAt || new Date().toISOString(),
        itemCount: mediaItems.length
      };
      
      setAlbums(prev => [...prev, newAlbum]);
      closeUploadModal();
      
      toast({
        title: "Album created",
        description: `Successfully created "${newAlbum.title}" with ${newAlbum.itemCount} items.`
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

          <AlbumGrid albums={albums} />
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
