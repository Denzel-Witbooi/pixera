
import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MediaItemActions from "@/components/MediaItemActions";
import { supabase } from "@/integrations/supabase/client";
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
  onDownload: () => void;
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
  const { toast } = useToast();

  const handleDeleteItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItemId) return;
    
    try {
      setIsDeleting(true);
      
      // Find the item to get its details
      const itemToDelete = items.find(item => item.id === selectedItemId);
      if (!itemToDelete) return;
      
      // Delete from database
      const { error } = await supabase
        .from("media_items")
        .delete()
        .eq("id", selectedItemId);
      
      if (error) throw error;
      
      // We'll just reload the page rather than manipulating state
      // This ensures we get fresh data from the server
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
      
      // Extract album ID from the first media item
      if (items.length === 0) return;
      const albumId = items[0].albumId;
      
      // Update album cover
      const { error } = await supabase
        .from("albums")
        .update({ cover_url: itemUrl })
        .eq("id", albumId);
      
      if (error) throw error;
      
      toast({
        title: "Cover updated",
        description: "The album cover has been successfully updated.",
      });
      
      // We'll just reload the page rather than manipulating state
      // This ensures we get fresh data from the server
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">{items.length} {items.length === 1 ? 'Item' : 'Items'}</h2>
        <Button
          onClick={onDownload}
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="group relative overflow-hidden bg-muted rounded-md border">
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
                  controls
                  muted
                  playsInline
                />
              )}
            </AspectRatio>
            
            <MediaItemActions 
              item={item}
              albumId={item.albumId}
              isEditable={isEditable}
              onSetAsCover={handleSetAsCover}
              onDelete={handleDeleteItem}
            />
          </div>
        ))}
      </div>

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
