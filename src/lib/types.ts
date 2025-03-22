
export type Album = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  createdAt: string;
  itemCount: number;
  userId: string;
};

export type MediaItem = {
  id: string;
  albumId: string;
  url: string;
  type: "image" | "video";
  createdAt: string;
  title?: string;
  description?: string;
};

export type UploadState = {
  isUploading: boolean;
  progress: number;
  error: string | null;
};
