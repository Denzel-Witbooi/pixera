import type { Album, MediaItem } from "@/lib/types";
import type { DataAdapter } from "./types";
import keycloak from "@/lib/keycloak";

export class DotNetAdapter implements DataAdapter {
  constructor(private readonly baseUrl: string) {}

  private authHeaders(): HeadersInit {
    return keycloak.token
      ? { Authorization: `Bearer ${keycloak.token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }

  async fetchAlbums(): Promise<Album[]> {
    const res = await fetch(`${this.baseUrl}/api/albums`);
    if (!res.ok) throw new Error(`GET /api/albums failed: ${res.status}`);
    return res.json();
  }

  async fetchAlbum(id: string): Promise<Album | null> {
    const res = await fetch(`${this.baseUrl}/api/albums/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /api/albums/${id} failed: ${res.status}`);
    return res.json();
  }

  async fetchAlbumBySlug(slug: string): Promise<Album | null> {
    const res = await fetch(`${this.baseUrl}/api/albums/slug/${slug}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /api/albums/slug/${slug} failed: ${res.status}`);
    return res.json();
  }

  async createAlbum(album: Omit<Album, "itemCount">): Promise<Album> {
    const res = await fetch(`${this.baseUrl}/api/admin/albums`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({ title: album.title, description: album.description }),
    });
    if (!res.ok) throw new Error(`POST /api/admin/albums failed: ${res.status}`);
    return res.json();
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/albums/${id}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify({ title: updates.title, description: updates.description ?? "" }),
    });
    if (!res.ok) throw new Error(`PUT /api/admin/albums/${id} failed: ${res.status}`);
  }

  async deleteAlbum(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/albums/${id}`, {
      method: "DELETE",
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`DELETE /api/admin/albums/${id} failed: ${res.status}`);
  }

  async updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/albums/${albumId}/cover`, {
      method: "PATCH",
      headers: this.authHeaders(),
      body: JSON.stringify({ coverUrl }),
    });
    if (!res.ok) throw new Error(`PATCH /api/admin/albums/${albumId}/cover failed: ${res.status}`);
  }

  async fetchMedia(albumId: string): Promise<MediaItem[]> {
    const res = await fetch(`${this.baseUrl}/api/albums/${albumId}/media`);
    if (!res.ok) throw new Error(`GET /api/albums/${albumId}/media failed: ${res.status}`);
    return res.json();
  }

  fetchMediaCountsForAlbums(_albumIds: string[]): Promise<Record<string, number>> {
    throw new Error("Not implemented");
  }

  async insertMedia(items: MediaItem[]): Promise<void> {
    for (const item of items) {
      const res = await fetch(`${this.baseUrl}/api/admin/albums/${item.albumId}/media`, {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify({
          url: item.url,
          type: item.type,
          title: item.title,
          description: item.description,
        }),
      });
      if (!res.ok) throw new Error(`POST /api/admin/albums/${item.albumId}/media failed: ${res.status}`);
    }
  }

  async deleteMedia(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/media/${id}`, {
      method: "DELETE",
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`DELETE /api/admin/media/${id} failed: ${res.status}`);
  }

  async uploadFile(file: File, albumId: string): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("albumId", albumId);
    const headers: HeadersInit = keycloak.token
      ? { Authorization: `Bearer ${keycloak.token}` }
      : {};
    const res = await fetch(`${this.baseUrl}/api/admin/storage/upload`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const { url } = await res.json();
    return url as string;
  }
}
