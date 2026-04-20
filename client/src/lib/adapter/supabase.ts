import { supabase } from "@/integrations/supabase/client";
import { mapAlbumFromDB, mapAlbumsFromDB, mapMediaItemsFromDB } from "@/lib/mappers";
import type { Album, MediaItem } from "@/lib/types";
import type { DataAdapter } from "./types";

export class SupabaseAdapter implements DataAdapter {
  async fetchAlbums(): Promise<Album[]> {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return mapAlbumsFromDB(data || []);
  }

  async fetchAlbum(id: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapAlbumFromDB(data);
  }

  async createAlbum(album: Omit<Album, "itemCount">): Promise<Album> {
    const { data, error } = await supabase
      .from("albums")
      .insert({
        id: album.id,
        title: album.title,
        description: album.description,
        cover_url: album.coverUrl,
        user_id: album.userId,
        created_at: album.createdAt,
      })
      .select()
      .single();
    if (error) throw error;
    return mapAlbumFromDB(data);
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (updates.title !== undefined)       patch.title       = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.coverUrl !== undefined)    patch.cover_url   = updates.coverUrl;

    const { error } = await supabase.from("albums").update(patch).eq("id", id);
    if (error) throw error;
  }

  async deleteAlbum(id: string): Promise<void> {
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) throw error;
  }

  async updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
    return this.updateAlbum(albumId, { coverUrl });
  }

  async fetchMedia(albumId: string): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return mapMediaItemsFromDB(data || []);
  }

  async fetchMediaCountsForAlbums(albumIds: string[]): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from("media_items")
      .select("album_id, id")
      .in("album_id", albumIds);
    if (error) throw error;
    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      counts[item.album_id] = (counts[item.album_id] || 0) + 1;
    });
    return counts;
  }

  async insertMedia(items: MediaItem[]): Promise<void> {
    const { error } = await supabase.from("media_items").insert(
      items.map((item) => ({
        id: item.id,
        album_id: item.albumId,
        url: item.url,
        type: item.type,
        created_at: item.createdAt,
        title: item.title,
        description: item.description ?? null,
      }))
    );
    if (error) throw error;
  }

  async deleteMedia(id: string): Promise<void> {
    const { error } = await supabase.from("media_items").delete().eq("id", id);
    if (error) throw error;
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from("album_media").upload(path, file, {
      cacheControl: "public, max-age=31536000, immutable",
      upsert: false,
    });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("album_media").getPublicUrl(path);
    return publicUrl;
  }
}
