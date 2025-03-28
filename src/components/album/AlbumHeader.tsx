
import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Pencil, Trash2, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Album } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface AlbumHeaderProps {
  album: Album;
  isOwner: boolean;
  user: any;
  openEditDialog: () => void;
  openDeleteDialog: () => void;
  openUploadModal: () => void;
  handleSignIn: () => void;
}

const AlbumHeader: React.FC<AlbumHeaderProps> = ({
  album,
  isOwner,
  user,
  openEditDialog,
  openDeleteDialog,
  openUploadModal,
  handleSignIn
}) => {
  const { isMobile } = useIsMobile();
  
  return (
    <div className="mb-6 sm:mb-8">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Gallery
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-medium text-balance">{album?.title}</h1>
          {album?.description && (
            <p className="text-muted-foreground text-balance line-clamp-2">{album.description}</p>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <>
              <Button 
                onClick={openEditDialog}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex-shrink-0 flex items-center"
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              
              <Button 
                onClick={openDeleteDialog}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex-shrink-0 flex items-center text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          
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
    </div>
  );
};

export default AlbumHeader;
