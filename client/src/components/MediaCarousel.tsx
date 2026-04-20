
import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

// Import refactored components
import CarouselControls from "@/components/carousel/CarouselControls";
import MediaDisplay from "@/components/carousel/MediaDisplay";
import { useCarouselDownload } from "@/components/carousel/useCarouselDownload";
import { useCarouselKeyboard } from "@/components/carousel/useCarouselKeyboard";

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
  const { isMobile } = useIsMobile();
  
  // Use our custom hooks for state management and side effects
  const { currentIndex, setCurrentIndex, handleDownload } = useCarouselDownload(items);
  
  // Initialize current index from props
  useState(() => {
    setCurrentIndex(initialIndex);
  });
  
  // Use our keyboard navigation hook with currentIndex
  useCarouselKeyboard({
    isOpen,
    onClose,
    items,
    setCurrentIndex,
    currentIndex
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <CarouselControls onDownload={handleDownload} onClose={onClose} />
      
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
                <MediaDisplay item={item} index={index} />
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
