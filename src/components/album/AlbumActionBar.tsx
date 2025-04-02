
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AlbumActionBarProps {
  itemCount: number;
  onShare: () => void;
  onDownload: () => void;
}

const AlbumActionBar: React.FC<AlbumActionBarProps> = ({
  itemCount,
  onShare,
  onDownload
}) => {
  const { isMobile } = useIsMobile();

  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-medium">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</h2>
      <div className="flex gap-2">
        <Button
          onClick={onShare}
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="flex items-center gap-2"
        >
          <Share className="h-4 w-4" />
          Share
        </Button>
        <Button
          onClick={onDownload}
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </div>
    </div>
  );
};

export default AlbumActionBar;
