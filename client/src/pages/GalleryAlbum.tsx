import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, FolderDown } from "lucide-react";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album, MediaItem } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";

import MediaCarousel from "@/components/MediaCarousel";
import { Button } from "@/components/ui/button";
import { buildAlbumZip } from "@/lib/buildAlbumZip";
import { useToast } from "@/components/ui/use-toast";

const GalleryAlbum = () => {
  const { slug } = useParams<{ slug: string }>();
  const adapter = useAdapter();
  const { toast } = useToast();

  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { data: album, isLoading: albumLoading } = useQuery<Album | null>({
    queryKey: queryKeys.albumSlug(slug!),
    queryFn: () => adapter.fetchAlbumBySlug(slug!),
    enabled: !!slug,
  });

  const { data: media = [], isLoading: mediaLoading } = useQuery<MediaItem[]>({
    queryKey: queryKeys.media(album?.id ?? ""),
    queryFn: () => adapter.fetchMedia(album!.id),
    enabled: !!album,
  });

  const openCarousel = (index: number) => {
    setCarouselIndex(index);
    setCarouselOpen(true);
  };

  const handleDownloadAll = async () => {
    if (media.length === 0) return;
    toast({ title: "Building ZIP…", description: `Packaging ${media.length} files.` });
    try {
      const zip = await buildAlbumZip(media);
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${album?.title ?? "album"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      toast({ title: "Download ready", description: "Your ZIP archive is downloading." });
    } catch {
      toast({ title: "ZIP failed", description: "Could not build the archive.", variant: "destructive" });
    }
  };

  if (albumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (album === null) return <Navigate to="/gallery/not-found" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/gallery" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Gallery</span>
          </Link>
          <span className="font-semibold text-lg flex-1 truncate">{album?.title}</span>
          {media.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAll} className="flex items-center gap-1.5">
              <FolderDown className="w-4 h-4" />
              <span className="hidden sm:inline">Download all</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        {album?.coverUrl && (
          <div className="relative w-full aspect-[21/6] rounded-xl overflow-hidden mb-8">
            <img src={resolveMediaUrl(album.coverUrl)} alt={album.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white">
              <h1 className="text-2xl sm:text-3xl font-medium">{album.title}</h1>
              {album.description && <p className="text-white/80 mt-1 text-sm sm:text-base">{album.description}</p>}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => openCarousel(index)}
                className="aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={item.title ?? `Media item ${index + 1}`}
              >
                {item.type === "image" ? (
                  <img
                    src={resolveMediaUrl(item.url)}
                    alt={item.title ?? ""}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <video src={resolveMediaUrl(item.url)} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      <MediaCarousel
        items={media}
        initialIndex={carouselIndex}
        isOpen={carouselOpen}
        albumTitle={album?.title}
        onClose={() => setCarouselOpen(false)}
      />
    </div>
  );
};

export default GalleryAlbum;
