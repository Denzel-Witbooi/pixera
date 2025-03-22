
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Album } from "@/lib/types";

export const useAlbumActions = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const deleteAlbum = async (albumId: string) => {
    if (!albumId) return;
    
    try {
      setIsDeleting(true);
      
      // Delete album - cascade will handle media items
      const { error } = await supabase
        .from("albums")
        .delete()
        .eq("id", albumId);
      
      if (error) throw error;
      
      toast({
        title: "Album deleted",
        description: "The album has been successfully deleted."
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error deleting album:", error);
      toast({
        title: "Failed to delete album",
        description: "There was an error deleting the album. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateAlbum = async (albumId: string, updates: Partial<Album>) => {
    if (!albumId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from("albums")
        .update({ 
          title: updates.title,
          description: updates.description,
          cover_url: updates.coverUrl
        })
        .eq("id", albumId);
      
      if (error) throw error;
      
      toast({
        title: "Album updated",
        description: "The album has been successfully updated."
      });
      
      return true;
    } catch (error) {
      console.error("Error updating album:", error);
      toast({
        title: "Failed to update album",
        description: "There was an error updating the album. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    deleteAlbum,
    updateAlbum,
    isDeleting,
    isUpdating
  };
};
