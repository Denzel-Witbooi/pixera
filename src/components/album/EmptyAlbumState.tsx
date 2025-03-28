
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmptyAlbumStateProps {
  user: any;
  openUploadModal: () => void;
}

const EmptyAlbumState: React.FC<EmptyAlbumStateProps> = ({ user, openUploadModal }) => {
  const { isMobile } = useIsMobile();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <h3 className="text-lg sm:text-xl font-medium text-foreground/80 mb-2">No media in this album</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {user ? "Add some photos or videos to get started." : "There are no photos or videos in this album yet."}
      </p>
      {user && (
        <Button onClick={openUploadModal} size={isMobile ? "sm" : "default"}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Media
        </Button>
      )}
    </div>
  );
};

export default EmptyAlbumState;
