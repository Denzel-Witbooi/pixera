
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Album } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";

export const useAlbumActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adapter = useAdapter();

  const deleteMutation = useMutation({
    mutationFn: (albumId: string) => adapter.deleteAlbum(albumId),
    onSuccess: (_data, albumId) => {
      queryClient.removeQueries({ queryKey: queryKeys.album(albumId) });
      queryClient.removeQueries({ queryKey: queryKeys.media(albumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
      toast({
        title: "Album deleted",
        description: "The album has been successfully deleted.",
      });
      navigate("/");
    },
    onError: (error) => {
      console.error("Error deleting album:", error);
      toast({
        title: "Failed to delete album",
        description: "There was an error deleting the album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ albumId, updates }: { albumId: string; updates: Partial<Album> }) =>
      adapter.updateAlbum(albumId, updates),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
      toast({
        title: "Album updated",
        description: "The album has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating album:", error);
      toast({
        title: "Failed to update album",
        description: "There was an error updating the album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAlbum = (albumId: string) => deleteMutation.mutate(albumId);

  const updateAlbum = (albumId: string, updates: Partial<Album>) =>
    new Promise<boolean>((resolve) => {
      updateMutation.mutate(
        { albumId, updates },
        {
          onSuccess: () => resolve(true),
          onError: () => resolve(false),
        }
      );
    });

  return {
    deleteAlbum,
    updateAlbum,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
