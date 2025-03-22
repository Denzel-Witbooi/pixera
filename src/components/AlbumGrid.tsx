
import React from "react";
import AlbumCard from "./AlbumCard";
import { Album } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AlbumGridProps {
  albums: Album[];
  className?: string;
}

const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, className }) => {
  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-2xl font-medium text-foreground/80 mb-2">No albums yet</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Create your first album by clicking the "Create Album" button above.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", className)}>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};

export default AlbumGrid;
