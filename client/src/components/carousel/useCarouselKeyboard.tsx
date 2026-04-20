
import { useEffect } from "react";
import { MediaItem } from "@/lib/types";

interface UseCarouselKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  setCurrentIndex: (index: number) => void;
  currentIndex: number; // Add current index to track the current position
}

export const useCarouselKeyboard = ({
  isOpen,
  onClose,
  items,
  setCurrentIndex,
  currentIndex
}: UseCarouselKeyboardProps) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling of the body when the carousel is open
      document.body.style.overflow = "hidden";
      
      // Focus trap and keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "ArrowLeft") {
          // Calculate the new index directly instead of using a callback function
          const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          setCurrentIndex(newIndex);
        } else if (e.key === "ArrowRight") {
          // Calculate the new index directly instead of using a callback function
          const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          setCurrentIndex(newIndex);
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, items.length, onClose, setCurrentIndex, currentIndex]);
};
