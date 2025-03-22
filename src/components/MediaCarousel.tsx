
import React, { useState, useEffect } from "react";
import { MediaItem } from "@/lib/types";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface MediaCarouselProps {
  items: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  items,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling of the body when the carousel is open
      document.body.style.overflow = "hidden";
      
      // Focus trap and keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "ArrowLeft") {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        } else if (e.key === "ArrowRight") {
          setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, items.length, onClose]);

  if (!isOpen) return null;

  const currentItem = items[currentIndex];

  const handleDownload = async () => {
    if (!currentItem) return;
    
    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      
      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      
      // Set filename based on item title or default
      const extension = currentItem.url.split('.').pop() || 'jpg';
      const fileName = `${currentItem.title || `image-${currentIndex + 1}`}.${extension}`;
      downloadLink.download = fileName;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download started",
        description: "Your media file is being downloaded."
      });
    } catch (error) {
      console.error("Failed to download:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleDownload}
          className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background"
        >
          <Download className="h-5 w-5" />
          <span className="sr-only">Download</span>
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onClose}
          className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <div className="max-w-6xl w-full mx-auto">
        <Carousel 
          className="w-full"
          opts={{
            align: "center",
            loop: true
          }}
          setApi={(api) => {
            if (api) {
              api.scrollTo(currentIndex);
            }
          }}
        >
          <CarouselContent>
            {items.map((item, index) => (
              <CarouselItem key={item.id}>
                <div className="p-1 md:p-2">
                  <div className="bg-black rounded-md overflow-hidden">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.title || `Media item ${index + 1}`}
                        className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
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
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="hidden sm:block">
            <CarouselPrevious className="h-10 w-10 left-3 sm:left-10 sm:-translate-x-0 border-2" />
            <CarouselNext className="h-10 w-10 right-3 sm:right-10 sm:-translate-x-0 border-2" />
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default MediaCarousel;
