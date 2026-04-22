import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FolderDown, Share2, Calendar, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album, MediaItem } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import PublicHeader from "@/components/PublicHeader";
import MediaCarousel from "@/components/MediaCarousel";
import FeedbackFAB from "@/components/FeedbackFAB";
import { Button } from "@/components/ui/button";
import { buildAlbumZip } from "@/lib/buildAlbumZip";

const GalleryAlbum = () => {
  const { slug } = useParams<{ slug: string }>();
  const adapter = useAdapter();

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
    toast.loading("Building ZIP…", { description: `Packaging ${media.length} files.` });
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
      toast.success("Download ready", { description: "Your ZIP archive is downloading." });
    } catch {
      toast.error("ZIP failed", { description: "Could not build the archive." });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: album?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch { /* user cancelled share or clipboard denied */ }
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
      <PublicHeader />

      {/* Album header */}
      <div className="border-b">
        <div className="container max-w-7xl mx-auto px-4 py-8 sm:py-10">
          {/* Metadata row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {album?.createdAt && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(album.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-border">·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {mediaLoading ? "…" : `${media.length} ${media.length === 1 ? "item" : "items"}`}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            {album?.title}
          </h1>

          {/* Description */}
          {album?.description && (
            <p className="text-muted-foreground text-base max-w-2xl mb-5">
              {album.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {!mediaLoading && media.length > 0 && (
              <Button size="sm" onClick={handleDownloadAll} className="flex items-center gap-1.5">
                <FolderDown className="w-4 h-4" />
                Download all
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleShare} className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              Share album
            </Button>
          </div>
        </div>
      </div>

      {/* Media grid */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {mediaLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : media.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No media in this album yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => openCarousel(index)}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                className="aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary animate-in fade-in-0 duration-300"
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
                  <video
                    src={resolveMediaUrl(item.url)}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
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

      <FeedbackFAB />
    </div>
  );
};

export default GalleryAlbum;
