
import { useState, useCallback } from "react";
import { MediaItem, UploadState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { isValidFileType, getMediaType, isWithinSizeLimit } from "@/lib/storage-helpers";
import { useAdapter } from "@/contexts/AdapterContext";

const UPLOAD_CONCURRENCY = 3;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export const useImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    completedUploads: 0,
    totalUploads: 0,
  });
  const { user } = useAuth();
  const adapter = useAdapter();

  const uploadToStorage = useCallback(
    async (files: File[], albumId: string): Promise<MediaItem[]> => {
      if (!user) throw new Error("User must be authenticated to upload files");

      const invalidFiles = files.filter((f) => !isValidFileType(f));
      if (invalidFiles.length > 0)
        throw new Error(`Invalid file type(s): ${invalidFiles.map((f) => f.name).join(", ")}`);

      const oversizedFiles = files.filter((f) => !isWithinSizeLimit(f));
      if (oversizedFiles.length > 0)
        throw new Error(`File(s) exceed size limit: ${oversizedFiles.map((f) => f.name).join(", ")}`);

      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        completedUploads: 0,
        totalUploads: files.length,
      });

      try {
        const uploadSingleFile = async (file: File): Promise<MediaItem> => {
          const fileId = uuidv4();
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/${albumId}/${fileId}.${fileExt}`;
          const fileType = getMediaType(file);

          const progressInterval = setInterval(() => {
            setUploadState((prev) => ({
              ...prev,
              progress: Math.min(prev.progress + 5 / files.length, 90),
            }));
          }, 200);

          const publicUrl = await adapter.uploadFile(file, filePath);
          clearInterval(progressInterval);

          setUploadState((prev) => ({
            ...prev,
            completedUploads: prev.completedUploads + 1,
            progress: Math.min(90, ((prev.completedUploads + 1) / prev.totalUploads) * 90),
          }));

          return {
            id: fileId,
            albumId,
            url: publicUrl,
            type: fileType,
            createdAt: new Date().toISOString(),
            title: file.name,
            description: "",
          };
        };

        const chunks = chunkArray(files, UPLOAD_CONCURRENCY);
        const mediaItems: MediaItem[] = [];
        for (const chunk of chunks) {
          const results = await Promise.all(chunk.map(uploadSingleFile));
          mediaItems.push(...results);
        }

        await adapter.insertMedia(mediaItems);

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          completedUploads: files.length,
          totalUploads: files.length,
        }));

        setTimeout(() => {
          setUploadState({ isUploading: false, progress: 0, error: null, completedUploads: 0, totalUploads: 0 });
        }, 1500);

        return mediaItems;
      } catch (error) {
        console.error("Upload error:", error);
        setUploadState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Failed to upload files",
          completedUploads: 0,
          totalUploads: 0,
        });
        throw error;
      }
    },
    [user, adapter]
  );

  const resetUploadState = useCallback(() => {
    setUploadState({ isUploading: false, progress: 0, error: null, completedUploads: 0, totalUploads: 0 });
  }, []);

  return { uploadState, uploadToStorage, resetUploadState };
};
