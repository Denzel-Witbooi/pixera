import React, { useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Upload, Star, Trash2, Loader2,
  ImageIcon, CheckCircle, XCircle, VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import keycloak from "@/lib/keycloak";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:5000";

// ── Per-file upload queue ──────────────────────────────────────────────────────

type QueueStatus = "pending" | "uploading" | "done" | "error";

type QueueItem = {
  key: string;
  file: File;
  status: QueueStatus;
  progress: number;
  error?: string;
};

function uploadWithProgress(
  file: File,
  albumId: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("albumId", albumId);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((JSON.parse(xhr.responseText) as { url: string }).url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    xhr.open("POST", `${API_URL}/api/admin/storage/upload`);
    if (keycloak.token) xhr.setRequestHeader("Authorization", `Bearer ${keycloak.token}`);
    xhr.send(form);
  });
}

// ── Status icon for queue items ────────────────────────────────────────────────

const QueueStatusIcon: React.FC<{ status: QueueStatus }> = ({ status }) => {
  if (status === "done")      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (status === "error")     return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
  if (status === "uploading") return <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />;
  return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />;
};

// ── Main page ──────────────────────────────────────────────────────────────────

const AdminAlbumDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const adapter = useAdapter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState<string | null>(null);

  const { data: album } = useQuery({
    queryKey: queryKeys.albumSlug(slug!),
    queryFn: () => adapter.fetchAlbumBySlug(slug!),
    enabled: !!slug,
  });

  const albumId = album?.id;

  const { data: media = [], isLoading: mediaLoading } = useQuery({
    queryKey: queryKeys.media(albumId ?? ""),
    queryFn: () => adapter.fetchMedia(albumId!),
    enabled: !!albumId,
  });

  const invalidateAll = useCallback(() => {
    if (!albumId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.media(albumId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.albumSlug(slug!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
  }, [queryClient, albumId, slug]);

  // ── Upload handler ───────────────────────────────────────────────────────────

  const processFiles = useCallback(async (files: File[]) => {
    if (!albumId) return;

    const newItems: QueueItem[] = files.map((file) => ({
      key: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: "pending",
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);

    await Promise.allSettled(
      newItems.map(async (item) => {
        try {
          setQueue((prev) =>
            prev.map((q) => q.key === item.key ? { ...q, status: "uploading" } : q),
          );

          const url = await uploadWithProgress(item.file, albumId, (pct) =>
            setQueue((prev) =>
              prev.map((q) => q.key === item.key ? { ...q, progress: pct } : q),
            ),
          );

          const mediaType: MediaItem["type"] =
            item.file.type.startsWith("video/") ? "video" : "image";

          await adapter.insertMedia([{
            id: "",
            albumId,
            url,
            type: mediaType,
            createdAt: "",
          }]);

          invalidateAll();

          setQueue((prev) =>
            prev.map((q) =>
              q.key === item.key ? { ...q, status: "done", progress: 100 } : q,
            ),
          );
        } catch (err) {
          setQueue((prev) =>
            prev.map((q) =>
              q.key === item.key
                ? { ...q, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : q,
            ),
          );
        }
      }),
    );
  }, [albumId, adapter, invalidateAll]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (files.length) processFiles(files);
  };

  // ── Delete handler ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adapter.deleteMedia(deleteTarget.id);
      invalidateAll();
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Set cover handler ────────────────────────────────────────────────────────

  const handleSetCover = async (item: MediaItem) => {
    if (!albumId) return;
    setIsSettingCover(item.id);
    try {
      await adapter.updateAlbumCover(albumId, item.url);
      invalidateAll();
      toast.success("Cover updated");
    } catch {
      toast.error("Failed to set cover");
    } finally {
      setIsSettingCover(null);
    }
  };

  const activeUploads = queue.filter((q) => q.status === "pending" || q.status === "uploading").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/albums">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{album?.title ?? "Album"}</h1>
          {album?.description && (
            <p className="text-muted-foreground text-sm mt-0.5">{album.description}</p>
          )}
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="font-medium text-sm">Drop images or videos here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Uploads {activeUploads > 0 ? `— ${activeUploads} in progress` : "— complete"}
            </p>
            {activeUploads === 0 && (
              <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {queue.map((item) => (
              <div key={item.key} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                <QueueStatusIcon status={item.status} />
                <span className="flex-1 text-sm truncate">{item.file.name}</span>
                {item.status === "uploading" && (
                  <div className="w-24 flex-shrink-0">
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                )}
                {item.status === "error" && (
                  <span className="text-xs text-destructive flex-shrink-0">{item.error}</span>
                )}
                {item.status === "done" && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">Done</span>
                )}
                {item.status === "pending" && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">Waiting</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media grid */}
      <div>
        <p className="text-sm font-medium mb-3">
          {media.length} {media.length === 1 ? "item" : "items"}
        </p>

        {mediaLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No media yet. Upload some files above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {media.map((item) => {
              const isCover = item.url === album?.coverUrl;
              return (
                <div key={item.id} className="group relative aspect-square rounded-md overflow-hidden bg-muted">
                  {item.type === "image" ? (
                    <img
                      src={`${API_URL}${item.url}`}
                      alt={item.title ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <VideoIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Cover badge */}
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 rounded px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Cover
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end gap-1 p-1.5">
                    {!isCover && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        title="Set as cover"
                        disabled={isSettingCover === item.id}
                        onClick={() => handleSetCover(item)}
                      >
                        {isSettingCover === item.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Star className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      title="Delete item"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              The file will be permanently removed from storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAlbumDetail;
