import * as localStore from "@/lib/local-store";
import { getMediaType } from "@/lib/storage-helpers";
import type { Album, MediaItem } from "@/lib/types";
import type { DataAdapter } from "./types";

export class LocalAdapter implements DataAdapter {
  fetchAlbums(): Promise<Album[]> {
    return Promise.resolve(localStore.getAlbums());
  }

  fetchAlbum(id: string): Promise<Album | null> {
    return Promise.resolve(localStore.getAlbum(id));
  }

  fetchAlbumBySlug(slug: string): Promise<Album | null> {
    return Promise.resolve(localStore.getAlbumBySlug(slug));
  }

  createAlbum(album: Omit<Album, "itemCount">): Promise<Album> {
    return Promise.resolve(localStore.insertAlbum(album));
  }

  updateAlbum(id: string, updates: Partial<Album>): Promise<void> {
    localStore.updateAlbum(id, updates);
    return Promise.resolve();
  }

  deleteAlbum(id: string): Promise<void> {
    localStore.deleteAlbum(id);
    return Promise.resolve();
  }

  updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
    return this.updateAlbum(albumId, { coverUrl });
  }

  fetchMedia(albumId: string): Promise<MediaItem[]> {
    return Promise.resolve(localStore.getMedia(albumId));
  }

  fetchMediaCountsForAlbums(albumIds: string[]): Promise<Record<string, number>> {
    return Promise.resolve(localStore.getMediaCountsForAlbums(albumIds));
  }

  insertMedia(items: MediaItem[]): Promise<void> {
    localStore.insertMedia(items);
    return Promise.resolve();
  }

  deleteMedia(id: string): Promise<void> {
    localStore.deleteMedia(id);
    return Promise.resolve();
  }

  uploadFile(file: File, path: string): Promise<string> {
    // Generate a deterministic URL from the path so the same file always
    // produces the same URL across renders. No real network call in local mode.
    const seed = path.replace(/[^a-z0-9]/gi, "-").slice(-24);
    const mediaType = getMediaType(file);
    const url =
      mediaType === "image"
        ? `https://picsum.photos/seed/${seed}/800/600`
        : "https://www.w3schools.com/html/mov_bbb.mp4";
    return Promise.resolve(url);
  }
}
