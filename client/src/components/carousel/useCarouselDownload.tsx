import { useState } from "react";
import { MediaItem } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { buildAlbumZip } from "@/lib/buildAlbumZip";

export const useCarouselDownload = (items: MediaItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handleDownload = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const ext = currentItem.url.split(".").pop()?.split("?")[0] ?? "jpg";
      const fileName = `${currentItem.title || `image-${currentIndex + 1}`}.${ext}`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);

      toast({ title: "Download started", description: "Your file is downloading." });
    } catch {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleDownloadAll = async (albumTitle = "album") => {
    toast({ title: "Building ZIP…", description: `Packaging ${items.length} files.` });
    try {
      const zip = await buildAlbumZip(items);
      const blob = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${albumTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);

      toast({ title: "Download ready", description: "Your ZIP archive is downloading." });
    } catch {
      toast({ title: "ZIP failed", description: "Could not build the archive.", variant: "destructive" });
    }
  };

  return { currentIndex, setCurrentIndex, handleDownload, handleDownloadAll };
};
