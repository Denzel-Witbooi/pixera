
import { useEffect } from "react";
import { MediaItem } from "@/lib/types";

interface UseCarouselKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  setCurrentIndex: (index: number) => void;
}

export const useCarouselKeyboard = ({
  isOpen,
  onClose,
  items,
  setCurrentIndex
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
  }, [isOpen, items.length, onClose, setCurrentIndex]);
};
