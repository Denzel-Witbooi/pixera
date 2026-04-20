
import React from "react";
import AlbumCard from "./AlbumCard";
import { Album } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AlbumGridProps {
  albums: Album[];
  className?: string;
}

const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, className }) => {
  const { isMobile, isTablet } = useIsMobile();
  
  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
        <h3 className="text-xl sm:text-2xl font-medium text-foreground/80 mb-2">No albums yet</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Create your first album by clicking the "Create Album" button above.
        </p>
      </div>
    );
  }

  // Determine the appropriate grid based on screen size
  const gridClassName = cn(
    "grid gap-4 sm:gap-6",
    isMobile ? "grid-cols-1" : 
    isTablet ? "grid-cols-2" : 
    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    className
  );

  return (
    <div className={gridClassName}>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};

export default AlbumGrid;
