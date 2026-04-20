import type { Album, MediaItem } from "@/lib/types";
import type { DataAdapter } from "./types";

export class DotNetAdapter implements DataAdapter {
  constructor(private readonly baseUrl: string) {}

  async fetchAlbums(): Promise<Album[]> {
    const res = await fetch(`${this.baseUrl}/api/albums`);
    if (!res.ok) throw new Error(`GET /api/albums failed: ${res.status}`);
    return res.json();
  }

  fetchAlbum(_id: string): Promise<Album | null> {
    throw new Error("Not implemented");
  }

  createAlbum(_album: Omit<Album, "itemCount">): Promise<Album> {
    throw new Error("Not implemented");
  }

  updateAlbum(_id: string, _updates: Partial<Album>): Promise<void> {
    throw new Error("Not implemented");
  }

  deleteAlbum(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  updateAlbumCover(_albumId: string, _coverUrl: string): Promise<void> {
    throw new Error("Not implemented");
  }

  fetchMedia(_albumId: string): Promise<MediaItem[]> {
    throw new Error("Not implemented");
  }

  fetchMediaCountsForAlbums(_albumIds: string[]): Promise<Record<string, number>> {
    throw new Error("Not implemented");
  }

  insertMedia(_items: MediaItem[]): Promise<void> {
    throw new Error("Not implemented");
  }

  deleteMedia(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  uploadFile(_file: File, _path: string): Promise<string> {
    throw new Error("Not implemented");
  }
}
