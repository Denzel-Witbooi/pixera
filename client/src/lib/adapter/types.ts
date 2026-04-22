import type { Album, MediaItem } from "@/lib/types";

export type BackendType = "local" | "dotnet";

export const queryKeys = {
  albums:      ()               => ["albums"]             as const,
  album:       (id: string)     => ["album", id]          as const,
  albumSlug:   (slug: string)   => ["album", "slug", slug] as const,
  media:       (albumId: string) => ["media", albumId]    as const,
  mediaCounts: (ids: string[])  => ["stats", ids]         as const,
} as const;

export interface DataAdapter {
  // Albums
  fetchAlbums(): Promise<Album[]>;
  fetchAlbum(id: string): Promise<Album | null>;
  fetchAlbumBySlug(slug: string): Promise<Album | null>;
  createAlbum(album: Omit<Album, "itemCount">): Promise<Album>;
  updateAlbum(id: string, updates: Partial<Album>): Promise<void>;
  deleteAlbum(id: string): Promise<void>;
  updateAlbumCover(albumId: string, coverUrl: string): Promise<void>;
  // Media
  fetchMedia(albumId: string): Promise<MediaItem[]>;
  fetchMediaCountsForAlbums(albumIds: string[]): Promise<Record<string, number>>;
  insertMedia(items: MediaItem[]): Promise<void>;
  deleteMedia(id: string): Promise<void>;
  // Storage
  uploadFile(file: File, path: string): Promise<string>;
}
