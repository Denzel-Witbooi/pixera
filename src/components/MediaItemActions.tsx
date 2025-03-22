
import React from "react";
import { MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Image, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MediaItemActionsProps {
  item: MediaItem;
  albumId: string;
  isEditable: boolean;
  onSetAsCover: (itemUrl: string) => void;
  onDelete: (itemId: string) => void;
}

const MediaItemActions: React.FC<MediaItemActionsProps> = ({
  item,
  albumId,
  isEditable,
  onSetAsCover,
  onDelete
}) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.title || `media-${item.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {isEditable && (
          <>
            <DropdownMenuItem onClick={() => onSetAsCover(item.url)}>
              <Image className="mr-2 h-4 w-4" />
              <span>Set as cover</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MediaItemActions;
