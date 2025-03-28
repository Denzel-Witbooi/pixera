
import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Download, Loader2, Share } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MediaItemActions from "@/components/MediaItemActions";
import MediaCarousel from "@/components/MediaCarousel";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { isMobile } = useIsMobile();
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

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied",
      description: "Album link copied to clipboard."
    });
    
    setIsShareDialogOpen(false);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">{items.length} {items.length === 1 ? 'Item' : 'Items'}</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button
            onClick={handleDownloadAll}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="group relative overflow-hidden bg-muted rounded-md border cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openCarousel(index)}
          >
            <AspectRatio ratio={1}>
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={item.title || "Album image"}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <video
                  src={item.url}
                  className="object-cover w-full h-full"
                  muted
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </AspectRatio>
            
            <div onClick={(e) => e.stopPropagation()}>
              <MediaItemActions 
                item={item}
                albumId={item.albumId}
                isEditable={isEditable}
                onSetAsCover={handleSetAsCover}
                onDelete={handleDeleteItem}
              />
            </div>
          </div>
        ))}
      </div>

      <MediaCarousel
        items={items}
        initialIndex={carouselInitialIndex}
        isOpen={isCarouselOpen}
        onClose={closeCarousel}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this media item from the album.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Album</AlertDialogTitle>
            <AlertDialogDescription>
              Share this album with others by copying the link below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-3 rounded-md overflow-x-auto mb-4">
            <code className="text-sm">{window.location.href}</code>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={copyShareLink}>
              Copy Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isDownloading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card shadow-lg rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Downloading Images</h3>
            <p className="text-muted-foreground">
              Please wait while we prepare your download...
            </p>
          </div>
        </div>
      )}

      {isCoverUpdating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card shadow-lg rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Updating Album Cover</h3>
            <p className="text-muted-foreground">
              Please wait while we update the album cover...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAlbum;
