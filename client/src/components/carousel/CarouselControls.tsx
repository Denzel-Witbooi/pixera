import React from "react";
import { X, Download, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselControlsProps {
  onDownload: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
}

const CarouselControls: React.FC<CarouselControlsProps> = ({ onDownload, onDownloadAll, onClose }) => (
  <div className="absolute top-4 right-4 flex gap-2 z-10">
    <Button
      variant="outline"
      size="icon"
      onClick={onDownload}
      title="Download this item"
      className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background"
    >
      <Download className="h-5 w-5" />
      <span className="sr-only">Download</span>
    </Button>
    <Button
      variant="outline"
      size="icon"
      onClick={onDownloadAll}
      title="Download all as ZIP"
      className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background"
    >
      <FolderDown className="h-5 w-5" />
      <span className="sr-only">Download all as ZIP</span>
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
);

export default CarouselControls;
