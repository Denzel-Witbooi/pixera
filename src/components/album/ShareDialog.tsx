
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onOpenChange }) => {
  const { toast } = useToast();

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied",
      description: "Album link copied to clipboard."
    });
    
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Share Album</AlertDialogTitle>
          <AlertDialogDescription>
            Share this album with others by copying the link below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted p-3 rounded-md overflow-x-auto mb-4">
          <code className="text-sm">{window.location.href}</code>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={copyShareLink}>
            Copy Link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ShareDialog;
