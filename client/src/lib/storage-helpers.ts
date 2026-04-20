
export const isValidFileType = (file: File): boolean => {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
};

export const getMediaType = (file: File): 'image' | 'video' => {
  return file.type.startsWith('image/') ? 'image' : 'video';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export const isWithinSizeLimit = (file: File, maxSizeMB = 100): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

export const getThumbUrl = (url: string, _width = 400): string => url;
