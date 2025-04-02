
import { useState } from "react";
import { MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

export const useCarouselDownload = (items: MediaItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handleDownload = async () => {
    const currentItem = items[currentIndex];
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

  return {
    currentIndex,
    setCurrentIndex,
    handleDownload
  };
};
