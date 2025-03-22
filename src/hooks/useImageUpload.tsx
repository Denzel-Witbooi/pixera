
import { useState, useCallback } from "react";
import { MediaItem, UploadState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapMediaItemFromDB } from "@/lib/mappers";
import { isValidFileType, getMediaType, isWithinSizeLimit } from "@/lib/storage-helpers";

export const useImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    completedUploads: 0,
    totalUploads: 0
  });
  const { user } = useAuth();

  const uploadToStorage = useCallback(async (files: File[], albumId: string): Promise<MediaItem[]> => {
    if (!user) {
      throw new Error("User must be authenticated to upload files");
    }

    // Validate files before starting the upload
    const invalidFiles = files.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      throw new Error(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(", ")}`);
    }
    
    const oversizedFiles = files.filter(file => !isWithinSizeLimit(file));
    if (oversizedFiles.length > 0) {
      throw new Error(`File(s) exceed size limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      completedUploads: 0,
      totalUploads: files.length
    });

    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileId = uuidv4();
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${albumId}/${fileId}.${fileExt}`;
        const fileType = getMediaType(file);
        
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
        
        // Update completed uploads count
        setUploadState(prev => ({
          ...prev,
          completedUploads: prev.completedUploads + 1
        }));
        
        // Return in the format expected by database
        return {
          id: fileId,
          album_id: albumId,
          url: publicUrl,
          type: fileType,
          created_at: new Date().toISOString(),
          title: file.name,
          description: null
        };
      });
      
      const dbMediaItems = await Promise.all(uploadPromises);
      
      // Insert media items into the database
      const { error } = await supabase
        .from("media_items")
        .insert(dbMediaItems);
      
      if (error) {
        throw error;
      }
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        completedUploads: files.length,
        totalUploads: files.length
      });
      
      // Convert to MediaItem format for the frontend
      return dbMediaItems.map(mapMediaItemFromDB);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to upload files",
        completedUploads: 0,
        totalUploads: 0
      });
      throw error;
    }
  }, [user]);

  return {
    uploadState,
    uploadToStorage
  };
};
