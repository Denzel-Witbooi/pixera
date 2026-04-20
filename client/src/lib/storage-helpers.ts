
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
 * Check if a file is within size limit
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

/**
 * Creates a temporary object URL for file preview
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Releases a previously created object URL to free memory
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Returns a CDN-resized thumbnail URL using Supabase Image Transformation.
 * Only applies to images stored in Supabase Storage — videos are returned unchanged.
 * The transformed image is served as WebP and cached at the Supabase CDN edge.
 *
 * @param url   The original public Supabase Storage URL
 * @param width Target width in pixels (default 400 — suitable for grid thumbnails)
 */
export const getThumbUrl = (url: string, width = 400): string => {
  if (!url) return url;
  // Only transform Supabase storage object URLs (not external or video blob URLs)
  if (!url.includes('/object/public/')) return url;
  return url.replace('/object/public/', '/render/image/public/') +
    `?width=${width}&quality=75&resize=cover`;
};
