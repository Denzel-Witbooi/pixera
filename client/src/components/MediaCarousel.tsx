import React, { useState, useRef, useEffect, useCallback } from "react";
import { MediaItem } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import CarouselControls from "@/components/carousel/CarouselControls";
import MediaDisplay from "@/components/carousel/MediaDisplay";
import { useCarouselDownload } from "@/components/carousel/useCarouselDownload";
import { useCarouselKeyboard } from "@/components/carousel/useCarouselKeyboard";

interface MediaCarouselProps {
  items: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  albumTitle?: string;
  onClose: () => void;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  items,
  initialIndex,
  isOpen,
  albumTitle = "album",
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const apiRef = useRef<CarouselApi>(null);
  // Prevents the scroll effect from re-firing when Embla itself triggered the index change
  const emblaDidScroll = useRef(false);

  const { handleDownload, handleDownloadAll } = useCarouselDownload(items, currentIndex);

  const handleSetApi = useCallback((api: CarouselApi) => {
    if (!api) return;
    apiRef.current = api;
    api.scrollTo(initialIndex, true);
    api.on("select", () => {
      emblaDidScroll.current = true;
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [initialIndex]);

  // Sync keyboard navigation → Embla (skip when Embla itself changed the index)
  useEffect(() => {
    if (emblaDidScroll.current) {
      emblaDidScroll.current = false;
      return;
    }
    apiRef.current?.scrollTo(currentIndex);
  }, [currentIndex]);

  useCarouselKeyboard({ isOpen, onClose, items, setCurrentIndex, currentIndex });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <CarouselControls
        onDownload={handleDownload}
        onDownloadAll={() => handleDownloadAll(albumTitle)}
        onClose={onClose}
      />

      <div className="max-w-6xl w-full mx-auto">
        <Carousel
          className="w-full"
          opts={{ align: "center", loop: true }}
          setApi={handleSetApi}
        >
          <CarouselContent>
            {items.map((item, index) => (
              <CarouselItem key={item.id}>
                <MediaDisplay item={item} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="hidden sm:block">
            <CarouselPrevious className="h-10 w-10 left-3 sm:left-10 border-2" />
            <CarouselNext className="h-10 w-10 right-3 sm:right-10 border-2" />
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default MediaCarousel;
