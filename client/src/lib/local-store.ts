/**
 * local-store.ts
 *
 * In-memory store backed by localStorage. Used when VITE_USE_LOCAL_DATA=true.
 * Seeded from mock-data.ts on first load; mutations persist across page reloads.
 * Call resetLocalStore() in the browser console to wipe and re-seed.
 */

import { Album, MediaItem } from "./types";
import { SEED_ALBUMS, SEED_MEDIA } from "./mock-data";

const ALBUMS_KEY = "pixera_local_albums";
const MEDIA_KEY = "pixera_local_media";

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : seed;
  } catch {
    return seed;
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function albums(): Album[] {
  return load<Album>(ALBUMS_KEY, SEED_ALBUMS);
}

function media(): MediaItem[] {
  return load<MediaItem>(MEDIA_KEY, SEED_MEDIA);
}

// ── Albums ────────────────────────────────────────────────────────────────────

export function getAlbums(): Album[] {
  return [...albums()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAlbum(id: string): Album | null {
  return albums().find((a) => a.id === id) ?? null;
}

export function getAlbumBySlug(slug: string): Album | null {
  return albums().find((a) => a.slug === slug) ?? null;
}

export function insertAlbum(album: Omit<Album, "itemCount">): Album {
  const next: Album = { ...album, itemCount: 0 };
  const all = [next, ...albums()];
  save(ALBUMS_KEY, all);
  return next;
}

export function updateAlbum(id: string, updates: Partial<Album>): Album | null {
  const all = albums().map((a) => (a.id === id ? { ...a, ...updates } : a));
  save(ALBUMS_KEY, all);
  return all.find((a) => a.id === id) ?? null;
}

export function deleteAlbum(id: string): void {
  save(ALBUMS_KEY, albums().filter((a) => a.id !== id));
  // cascade — remove all media for this album
  save(MEDIA_KEY, media().filter((m) => m.albumId !== id));
}

// ── Media items ───────────────────────────────────────────────────────────────

export function getMedia(albumId: string): MediaItem[] {
  return media()
    .filter((m) => m.albumId === albumId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getMediaCountsForAlbums(albumIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  media()
    .filter((m) => albumIds.includes(m.albumId))
    .forEach((m) => {
      counts[m.albumId] = (counts[m.albumId] || 0) + 1;
    });
  return counts;
}

export function insertMedia(items: MediaItem[]): MediaItem[] {
  const all = [...media(), ...items];
  save(MEDIA_KEY, all);
  // update album item counts
  const affectedAlbumIds = [...new Set(items.map((i) => i.albumId))];
  const allAlbums = albums().map((a) =>
    affectedAlbumIds.includes(a.id)
      ? { ...a, itemCount: all.filter((m) => m.albumId === a.id).length }
      : a
  );
  save(ALBUMS_KEY, allAlbums);
  return items;
}

export function deleteMedia(id: string): void {
  const item = media().find((m) => m.id === id);
  const remaining = media().filter((m) => m.id !== id);
  save(MEDIA_KEY, remaining);
  // update album item count
  if (item) {
    const allAlbums = albums().map((a) =>
      a.id === item.albumId
        ? { ...a, itemCount: remaining.filter((m) => m.albumId === a.id).length }
        : a
    );
    save(ALBUMS_KEY, allAlbums);
  }
}

// ── Dev utility ───────────────────────────────────────────────────────────────

/** Call this in the browser console to wipe all local data and reload with seed. */
export function resetLocalStore(): void {
  localStorage.removeItem(ALBUMS_KEY);
  localStorage.removeItem(MEDIA_KEY);
  window.location.reload();
}

// Expose reset on window for easy console access during development
if (typeof window !== "undefined") {
  (window as any).resetLocalStore = resetLocalStore;
}
