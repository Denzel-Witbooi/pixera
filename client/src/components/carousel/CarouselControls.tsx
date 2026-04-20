
import React from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselControlsProps {
  onDownload: () => void;
  onClose: () => void;
}

const CarouselControls: React.FC<CarouselControlsProps> = ({
  onDownload,
  onClose
}) => (
  <div className="absolute top-4 right-4 flex gap-2">
    <Button 
      variant="outline" 
      size="icon" 
      onClick={onDownload}
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
);

export default CarouselControls;
