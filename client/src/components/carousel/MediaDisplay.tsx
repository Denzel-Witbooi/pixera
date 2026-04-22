
import React from "react";
import { MediaItem } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";

interface MediaDisplayProps {
  item: MediaItem;
  index: number;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ item, index }) => (
  <div className="p-1 md:p-2">
    <div className="bg-black rounded-md overflow-hidden">
      {item.type === "image" ? (
        <img
          src={resolveMediaUrl(item.url)}
          alt={item.title || `Media item ${index + 1}`}
          className="w-full h-auto max-h-[80vh] object-contain mx-auto"
        />
      ) : (
        <video
          src={resolveMediaUrl(item.url)}
          controls
          playsInline
          muted
          className="w-full h-auto max-h-[80vh] object-contain mx-auto"
        />
      )}
    </div>
    {(item.title || item.description) && (
      <div className="p-2 text-center">
        {item.title && <h3 className="font-medium">{item.title}</h3>}
        {item.description && <p className="text-muted-foreground">{item.description}</p>}
      </div>
    )}
  </div>
);

export default MediaDisplay;
