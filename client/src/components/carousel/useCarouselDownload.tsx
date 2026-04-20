
import { useState } from "react";
import { MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useCarouselDownload = (items: MediaItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handleDownload = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);

      const extension = currentItem.url.split(".").pop() || "jpg";
      const fileName = `${currentItem.title || `image-${currentIndex + 1}`}.${extension}`;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Release object URL after a tick to allow the browser to start the download
      setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);

      toast({
        title: "Download started",
        description: "Your media file is being downloaded.",
      });
    } catch (error) {
      console.error("Failed to download:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  /** Download every item in the carousel sequentially with a 150 ms gap
   *  to avoid hammering Supabase Storage and hitting rate limits. */
  const handleDownloadAll = async (onProgress?: (done: number, total: number) => void) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);

        const extension = item.url.split(".").pop() || "jpg";
        downloadLink.download = `${item.title || `${item.type}-${i + 1}`}.${extension}`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);

        onProgress?.(i + 1, items.length);

        // Brief pause between requests — keeps us well under storage rate limits
        if (i < items.length - 1) await delay(150);
      } catch (error) {
        console.error(`Failed to download item ${i}:`, error);
      }
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleDownload,
    handleDownloadAll,
  };
};
