
import { useState, useCallback } from "react";
import { MediaItem, UploadState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });
  const { user } = useAuth();

  const uploadToStorage = useCallback(async (files: File[], albumId: string): Promise<MediaItem[]> => {
    if (!user) {
      throw new Error("User must be authenticated to upload files");
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null
    });

    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileId = uuidv4();
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${albumId}/${fileId}.${fileExt}`;
        const fileType = file.type.startsWith("image/") ? "image" : "video" as "image" | "video";
        
        // Update progress for this file
        const progressInterval = setInterval(() => {
          setUploadState(prev => ({
            ...prev,
            progress: Math.min(
              prev.progress + (5 / files.length),
              90
            )
          }));
        }, 200);
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("album_media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });
        
        clearInterval(progressInterval);
        
        if (error) {
          throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("album_media")
          .getPublicUrl(filePath);
        
        return {
          id: fileId,
          albumId,
          url: publicUrl,
          type: fileType,
          createdAt: new Date().toISOString(),
          title: file.name
        };
      });
      
      const mediaItems = await Promise.all(uploadPromises);
      
      // Insert media items into the database
      const { error } = await supabase
        .from("media_items")
        .insert(mediaItems);
      
      if (error) {
        throw error;
      }
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null
      });
      
      return mediaItems;
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to upload files"
      });
      throw error;
    }
  }, [user]);

  return {
    uploadState,
    uploadToStorage
  };
};
