
import React from "react";
import { Album } from "@/lib/types";
import UploadModal from "@/components/UploadModal";
import EditAlbumDialog from "@/components/EditAlbumDialog";
import DeleteAlbumDialog from "@/components/DeleteAlbumDialog";

interface AlbumDialogsProps {
  user: any;
  album: Album;
  isOwner: boolean;
  isUploadModalOpen: boolean;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  closeUploadModal: () => void;
  closeEditDialog: () => void;
  closeDeleteDialog: () => void;
  handleAddToAlbum: (albumData: Partial<Album>, files: File[]) => Promise<void>;
  handleUpdateAlbum: (updatedAlbum: Album) => Promise<void>;
}

const AlbumDialogs: React.FC<AlbumDialogsProps> = ({
  user,
  album,
  isOwner,
  isUploadModalOpen,
  isEditDialogOpen,
  isDeleteDialogOpen,
  closeUploadModal,
  closeEditDialog,
  closeDeleteDialog,
  handleAddToAlbum,
  handleUpdateAlbum
}) => {
  if (!user || !album) return null;
  
  return (
    <>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCreateAlbum={handleAddToAlbum}
        initialAlbum={album}
        mode="add-to-existing"
      />
      
      {isOwner && album && (
        <>
          <EditAlbumDialog
            album={album}
            isOpen={isEditDialogOpen}
            onClose={closeEditDialog}
            onSuccess={handleUpdateAlbum}
          />
          
          <DeleteAlbumDialog
            albumId={album.id}
            albumTitle={album.title}
            isOpen={isDeleteDialogOpen}
            onClose={closeDeleteDialog}
          />
        </>
      )}
    </>
  );
};

export default AlbumDialogs;
