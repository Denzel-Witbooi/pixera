

import { supabase } from '@/integrations/supabase/client';

/**
 * Get a public URL for a stored file
 */
export const getPublicURL = (path: string, bucket = 'album_media'): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Check if a file type is valid for upload
 */
export const isValidFileType = (file: File): boolean => {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
};

/**
 * Get the media type (image or video) from a file
 */
export const getMediaType = (file: File): 'image' | 'video' => {
  return file.type.startsWith('image/') ? 'image' : 'video';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Check if a file is within size limits
 */
export const isWithinSizeLimit = (file: File, maxSizeMB = 100): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Delete a file from storage
 */
export const deleteStorageFile = async (path: string, bucket = 'album_media'): Promise<boolean> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
};

