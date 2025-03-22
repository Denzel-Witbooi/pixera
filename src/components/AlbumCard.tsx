
import React from "react";
import { Link } from "react-router-dom";
import { Album } from "@/lib/types";
import { Calendar, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: Album;
  className?: string;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, className }) => {
  const formattedDate = new Date(album.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <Link 
      to={`/album/${album.id}`} 
      className={cn(
        "group relative overflow-hidden rounded-xl hover-card-animation",
        className
      )}
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        <img 
          src={album.coverUrl} 
          alt={album.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="space-y-1.5">
          <h3 className="font-medium text-lg line-clamp-1">{album.title}</h3>
          <p className="text-sm text-white/80 line-clamp-1">{album.description}</p>
          
          <div className="flex items-center justify-between text-xs text-white/70 pt-1">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Image className="w-3 h-3 mr-1" />
              <span>{album.itemCount} items</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AlbumCard;
