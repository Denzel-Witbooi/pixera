
import { useState, useCallback } from "react";
import { MediaItem, UploadState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export const useImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  // This is a mock function to simulate uploading to Supabase
  // In a real implementation, this would connect to Supabase Storage
  const uploadToStorage = useCallback(async (files: File[], albumId: string): Promise<MediaItem[]> => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null
    });

    try {
      // Simulate progress updates
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadState(prev => ({
            ...prev,
            progress: Math.min(progress, 90)
          }));
          
          if (progress >= 90) {
            clearInterval(interval);
          }
        }, 300);
        
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // Process each file
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          // In a real app, this would upload to Supabase Storage
          // For now, we'll create a local object URL as a placeholder
          const fileId = uuidv4();
          const fileType = file.type.startsWith("image/") ? "image" : "video" as "image" | "video";
          
          // We'd normally get this URL from Supabase after upload
          const url = URL.createObjectURL(file);
          
          return {
            id: fileId,
            albumId,
            url,
            type: fileType,
            createdAt: new Date().toISOString(),
            title: file.name
          };
        })
      );
      
      // Complete the progress simulation
      clearInterval(progressInterval);
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null
      });
      
      return processedFiles;
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to upload files"
      });
      throw error;
    }
  }, []);

  return {
    uploadState,
    uploadToStorage
  };
};
