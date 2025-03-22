
import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ViewAlbumProps {
  items: MediaItem[];
  albumTitle: string;
  onDownload: () => void;
}

const ViewAlbum: React.FC<ViewAlbumProps> = ({ items, albumTitle, onDownload }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  
  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };
  
  const closeLightbox = () => {
    setSelectedIndex(null);
  };
  
  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
    }
  };
  
  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % items.length);
    }
  };
  
  const handleShareAlbum = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "The album link has been copied to your clipboard."
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    } else if (e.key === "Escape") {
      closeLightbox();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">{albumTitle}</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-1"
            onClick={handleShareAlbum}
          >
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-1"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer image-card shadow-sm"
            onClick={() => openLightbox(index)}
          >
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={item.title || `Item ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={item.url}
                title={item.title || `Item ${index + 1}`}
                className="h-full w-full object-cover"
                controls={false}
                muted
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.target as HTMLVideoElement;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      {selectedIndex !== null && (
        <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
          <DialogContent 
            className="sm:max-w-5xl p-1 sm:p-2 h-[90vh] max-h-[90vh] flex flex-col"
            onKeyDown={handleKeyDown}
          >
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-foreground bg-background/80 backdrop-blur-sm rounded-full"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative flex-1 overflow-hidden">
              {selectedIndex !== null && items[selectedIndex].type === "image" ? (
                <img
                  src={items[selectedIndex].url}
                  alt={items[selectedIndex].title || `Item ${selectedIndex + 1}`}
                  className="h-full w-full object-contain"
                />
              ) : selectedIndex !== null && (
                <video
                  src={items[selectedIndex].url}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                />
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-1/2 left-2 -translate-y-1/2 text-foreground/80 hover:text-foreground",
                  "bg-background/80 backdrop-blur-sm rounded-full"
                )}
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-1/2 right-2 -translate-y-1/2 text-foreground/80 hover:text-foreground",
                  "bg-background/80 backdrop-blur-sm rounded-full"
                )}
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="mt-2 px-2">
              <p className="text-sm font-medium">
                {selectedIndex !== null &&
                  (items[selectedIndex].title || `Item ${selectedIndex + 1}`)}
              </p>
              {selectedIndex !== null && items[selectedIndex].description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {items[selectedIndex].description}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ViewAlbum;
