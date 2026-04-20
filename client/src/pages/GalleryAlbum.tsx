import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album, MediaItem } from "@/lib/types";

const GalleryAlbum = () => {
  const { id } = useParams<{ id: string; slug: string }>();
  const adapter = useAdapter();

  const { data: album, isLoading: albumLoading } = useQuery<Album | null>({
    queryKey: queryKeys.album(id!),
    queryFn: () => adapter.fetchAlbum(id!),
    enabled: !!id,
  });

  const { data: media = [], isLoading: mediaLoading } = useQuery<MediaItem[]>({
    queryKey: queryKeys.media(id!),
    queryFn: () => adapter.fetchMedia(id!),
    enabled: !!album,
  });

  if (albumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (album === null) {
    return <Navigate to="/gallery/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/gallery" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Gallery
          </Link>
          <span className="font-semibold text-lg">{album?.title}</span>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-10">
        {album?.coverUrl && (
          <div className="relative w-full aspect-[21/6] rounded-xl overflow-hidden mb-8">
            <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h1 className="text-3xl font-medium">{album.title}</h1>
              {album.description && <p className="text-white/80 mt-1">{album.description}</p>}
            </div>
          </div>
        )}

        {mediaLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : media.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No media in this album yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {media.map((item) => (
              <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.title ?? ""}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GalleryAlbum;
