import { Album, MediaItem } from "./types";

// Maps from Supabase database fields to our frontend types
export const mapAlbumFromDB = (dbAlbum: any): Album => {
  return {
    id: dbAlbum.id,
    title: dbAlbum.title,
    description: dbAlbum.description || "",
    coverUrl: dbAlbum.cover_url || "",
    createdAt: dbAlbum.created_at,
    itemCount: 0, // This will be calculated if needed elsewhere
    userId: dbAlbum.user_id
  };
};

export const mapAlbumsFromDB = (dbAlbums: any[]): Album[] => {
  return dbAlbums.map(mapAlbumFromDB);
};

export const mapMediaItemFromDB = (dbItem: any): MediaItem => {
  return {
    id: dbItem.id,
    albumId: dbItem.album_id,
    url: dbItem.url,
    type: dbItem.type as "image" | "video",
    createdAt: dbItem.created_at,
    title: dbItem.title || "",
    description: dbItem.description || "",
  };
};

export const mapMediaItemsToDB = (mediaItems: MediaItem[]): any[] => {
  return mediaItems.map(item => ({
    id: item.id,
    album_id: item.albumId,
    url: item.url,
    type: item.type,
    created_at: item.createdAt,
    title: item.title,
    description: item.description
  }));
};

export const mapMediaItemsFromDB = (dbItems: any[]): MediaItem[] => {
  return dbItems.map(mapMediaItemFromDB);
};
