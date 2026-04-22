import React from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import { Calendar, Image } from "lucide-react";

const GalleryHome = () => {
  const adapter = useAdapter();

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: queryKeys.albums(),
    queryFn: () => adapter.fetchAlbums(),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center">
          <span className="font-semibold text-lg">Pixera</span>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-medium tracking-tight mb-8">Gallery</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : albums.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No albums yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/gallery/${album.id}`}
                className="group relative overflow-hidden rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                  <img
                    src={resolveMediaUrl(album.coverUrl)}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-medium text-lg line-clamp-1">{album.title}</h3>
                  <div className="flex items-center justify-between text-xs text-white/70 pt-1">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{new Date(album.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center">
                      <Image className="w-3 h-3 mr-1" />
                      <span>{album.itemCount} items</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GalleryHome;
