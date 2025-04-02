
import React from "react";
import { MediaItem } from "@/lib/types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import MediaItemActions from "@/components/MediaItemActions";

interface MediaGridProps {
  items: MediaItem[];
  isEditable: boolean;
  onItemClick: (index: number) => void;
  onSetAsCover: (url: string) => void;
  onDeleteItem: (id: string) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  isEditable,
  onItemClick,
  onSetAsCover,
  onDeleteItem
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="group relative overflow-hidden bg-muted rounded-md border cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onItemClick(index)}
        >
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
                muted
                playsInline
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </AspectRatio>
          
          <div onClick={(e) => e.stopPropagation()}>
            <MediaItemActions 
              item={item}
              albumId={item.albumId}
              isEditable={isEditable}
              onSetAsCover={onSetAsCover}
              onDelete={onDeleteItem}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaGrid;
