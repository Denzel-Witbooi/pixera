import React from "react";
import { Loader2, Calendar, ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import PublicHeader from "@/components/PublicHeader";
import FeedbackFAB from "@/components/FeedbackFAB";

const GalleryHome = () => {
  const adapter = useAdapter();

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: queryKeys.albums(),
    queryFn: () => adapter.fetchAlbums(),
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Gallery</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {albums.length > 0
            ? `${albums.length} ${albums.length === 1 ? "album" : "albums"}`
            : ""}
        </p>

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
                to={`/gallery/${album.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-muted hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={resolveMediaUrl(album.coverUrl)}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Gradient + text overlay — sits on top of the image div, outside it */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent rounded-xl" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white text-base line-clamp-1 drop-shadow">
                    {album.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/70 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(album.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {album.itemCount} {album.itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <FeedbackFAB />
    </div>
  );
};

export default GalleryHome;
