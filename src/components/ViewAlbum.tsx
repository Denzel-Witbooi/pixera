
import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Import refactored components
import AlbumActionBar from "@/components/album/AlbumActionBar";
import MediaGrid from "@/components/album/MediaGrid";
import ShareDialog from "@/components/album/ShareDialog";
import DeleteItemDialog from "@/components/album/DeleteItemDialog";
import LoadingOverlay from "@/components/album/LoadingOverlay";
import MediaCarousel from "@/components/MediaCarousel";

interface ViewAlbumProps {
  items: MediaItem[];
  albumTitle: string;
  onDownload?: () => void;
  isEditable?: boolean;
}

const ViewAlbum: React.FC<ViewAlbumProps> = ({ 
  items, 
  albumTitle, 
  onDownload,
  isEditable = false
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverUpdating, setIsCoverUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);
  const { toast } = useToast();

  const handleDeleteItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItemId) return;
    
    try {
      setIsDeleting(true);
      
      const itemToDelete = items.find(item => item.id === selectedItemId);
      if (!itemToDelete) return;
      
      const { error } = await supabase
        .from("media_items")
        .delete()
        .eq("id", selectedItemId);
      
      if (error) throw error;
      
      window.location.reload();
      
      toast({
        title: "Media deleted",
        description: "The media has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: "Failed to delete media",
        description: "There was an error deleting the media. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSetAsCover = async (itemUrl: string) => {
    if (!itemUrl) return;
    
    try {
      setIsCoverUpdating(true);
      
      if (items.length === 0) return;
      const albumId = items[0].albumId;
      
      const { error } = await supabase
        .from("albums")
        .update({ cover_url: itemUrl })
        .eq("id", albumId);
      
      if (error) throw error;
      
      toast({
        title: "Cover updated",
        description: "The album cover has been successfully updated.",
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error updating cover:", error);
      toast({
        title: "Failed to update cover",
        description: "There was an error updating the album cover. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCoverUpdating(false);
    }
  };

  const handleDownloadAll = async () => {
    if (items.length === 0) {
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
      const folder = zip.folder(albumTitle || "album");
      
      if (!folder) throw new Error("Failed to create zip folder");
      
      // Create separate folders for images and videos
      const imageFolder = folder.folder("images");
      const videoFolder = folder.folder("videos");
      
      if (!imageFolder || !videoFolder) throw new Error("Failed to create media folders");
      
      const mediaPromises = items.map(async (item, index) => {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          
          const extension = item.url.split('.').pop() || (item.type === 'image' ? 'jpg' : 'mp4');
          const fileName = `${item.title || `${item.type}-${index + 1}`}.${extension}`;
          
          if (item.type === "image") {
            imageFolder.file(fileName, blob);
          } else if (item.type === "video") {
            videoFolder.file(fileName, blob);
          }
          
          return true;
        } catch (error) {
          console.error(`Failed to download ${item.url}:`, error);
          return false;
        }
      });
      
      await Promise.all(mediaPromises);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${albumTitle || "album"}.zip`);
      
      const imageCount = items.filter(item => item.type === "image").length;
      const videoCount = items.filter(item => item.type === "video").length;
      
      toast({
        title: "Download complete",
        description: `${imageCount} images and ${videoCount} videos have been downloaded.`
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

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const openCarousel = (index: number) => {
    setCarouselInitialIndex(index);
    setIsCarouselOpen(true);
  };

  const closeCarousel = () => {
    setIsCarouselOpen(false);
  };

  return (
    <div>
      <AlbumActionBar 
        itemCount={items.length}
        onShare={handleShare}
        onDownload={handleDownloadAll}
      />

      <MediaGrid 
        items={items}
        isEditable={isEditable}
        onItemClick={openCarousel}
        onSetAsCover={handleSetAsCover}
        onDeleteItem={handleDeleteItem}
      />

      <MediaCarousel
        items={items}
        initialIndex={carouselInitialIndex}
        isOpen={isCarouselOpen}
        onClose={closeCarousel}
      />

      <DeleteItemDialog 
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeleting}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      <ShareDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />

      <LoadingOverlay 
        isVisible={isDownloading}
        title="Downloading Images"
        description="Please wait while we prepare your download..."
      />

      <LoadingOverlay 
        isVisible={isCoverUpdating}
        title="Updating Album Cover"
        description="Please wait while we update the album cover..."
      />
    </div>
  );
};

export default ViewAlbum;
