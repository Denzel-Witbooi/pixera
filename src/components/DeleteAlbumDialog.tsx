
import React from "react";
import { useAlbumActions } from "@/hooks/useAlbumActions";
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
import { Loader2 } from "lucide-react";

interface DeleteAlbumDialogProps {
  albumId: string;
  albumTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAlbumDialog: React.FC<DeleteAlbumDialogProps> = ({
  albumId,
  albumTitle,
  isOpen,
  onClose,
}) => {
  const { deleteAlbum, isDeleting } = useAlbumActions();

  const handleDelete = async () => {
    await deleteAlbum(albumId);
    // No need to call onClose since we navigate away on success
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the album "{albumTitle}" and all photos and
            videos it contains. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Album"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAlbumDialog;
