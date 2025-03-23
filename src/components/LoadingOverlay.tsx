
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Upload, ImagePlus, Film } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  completedItems?: number;
  totalItems?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  progress = 0,
  message = "Loading...",
  completedItems,
  totalItems,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h3 className="text-lg font-medium">{message}</h3>
        </div>

        {(completedItems !== undefined && totalItems !== undefined) && (
          <div className="text-sm text-muted-foreground text-center">
            {completedItems} of {totalItems} items completed
          </div>
        )}

        <Progress value={progress} className="h-2" />

        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
        
        <div className="flex justify-center space-x-2 pt-2 opacity-70">
          {[...Array(3)].map((_, i) => (
            <span 
              key={i} 
              className="relative flex h-3 w-3"
            >
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 duration-${(i+1)*300}`}></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          ))}
        </div>
        
        <div className="flex justify-center gap-4 animate-pulse">
          <ImagePlus className="h-5 w-5 text-primary" />
          <Upload className="h-5 w-5 text-primary" />
          <Film className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
