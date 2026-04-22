import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Link2, Image, Loader2, Images } from "lucide-react";
import { toast } from "sonner";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";
import type { Album } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

// ── Album form dialog (create + edit) ─────────────────────────────────────────

interface AlbumFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  isPending: boolean;
  initial?: { title: string; description: string };
  mode: "create" | "edit";
}

const AlbumFormDialog: React.FC<AlbumFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isPending,
  initial,
  mode,
}) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), description.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Album" : "Edit Album"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "The album slug is auto-generated from the title and cannot be changed later."
                : "Update the title and description. The slug stays the same."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="album-title">Title</Label>
              <Input
                id="album-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Wedding 2026"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="album-description">Description</Label>
              <Textarea
                id="album-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Album"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; album: Album }
  | { type: "delete"; album: Album };

const AdminAlbums: React.FC = () => {
  const adapter = useAdapter();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const { data: albums = [], isLoading } = useQuery({
    queryKey: queryKeys.albums(),
    queryFn: () => adapter.fetchAlbums(),
  });

  const createMutation = useMutation({
    mutationFn: (vars: { title: string; description: string }) =>
      adapter.createAlbum({
        id: "",
        title: vars.title,
        description: vars.description,
        coverUrl: "",
        createdAt: "",
        slug: "",
        userId: "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
      toast.success("Album created");
      setDialog({ type: "none" });
    },
    onError: () => toast.error("Failed to create album"),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; title: string; description: string }) =>
      adapter.updateAlbum(vars.id, { title: vars.title, description: vars.description }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
      queryClient.invalidateQueries({ queryKey: queryKeys.album(vars.id) });
      toast.success("Album updated");
      setDialog({ type: "none" });
    },
    onError: () => toast.error("Failed to update album"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adapter.deleteAlbum(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.album(id) });
      queryClient.removeQueries({ queryKey: queryKeys.media(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.albums() });
      toast.success("Album deleted");
      setDialog({ type: "none" });
    },
    onError: () => toast.error("Failed to delete album"),
  });

  const copyShareableLink = (album: Album) => {
    const url = `${window.location.origin}/gallery/${album.slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied to clipboard"),
      () => toast.error("Failed to copy link"),
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Albums</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </p>
        </div>
        <Button onClick={() => setDialog({ type: "create" })} className="gap-2">
          <Plus className="h-4 w-4" />
          New Album
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No albums yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-3"
            >
              {/* Cover thumbnail */}
              <div className="h-14 w-20 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                {album.coverUrl ? (
                  <img
                    src={resolveMediaUrl(album.coverUrl)}
                    alt={album.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{album.title}</p>
                <p className="text-sm text-muted-foreground">
                  {album.itemCount} {album.itemCount === 1 ? "item" : "items"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" title="Manage media" asChild>
                  <Link to={`/admin/albums/${album.slug}`}>
                    <Images className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Copy shareable link"
                  onClick={() => copyShareableLink(album)}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edit album"
                  onClick={() => setDialog({ type: "edit", album })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete album"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDialog({ type: "delete", album })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {dialog.type === "create" && (
        <AlbumFormDialog
          open
          mode="create"
          onClose={() => setDialog({ type: "none" })}
          isPending={createMutation.isPending}
          onSubmit={(title, description) => createMutation.mutate({ title, description })}
        />
      )}

      {/* Edit dialog */}
      {dialog.type === "edit" && (
        <AlbumFormDialog
          open
          mode="edit"
          initial={{ title: dialog.album.title, description: dialog.album.description }}
          onClose={() => setDialog({ type: "none" })}
          isPending={updateMutation.isPending}
          onSubmit={(title, description) =>
            updateMutation.mutate({ id: dialog.album.id, title, description })
          }
        />
      )}

      {/* Delete confirmation */}
      {dialog.type === "delete" && (
        <AlertDialog
          open
          onOpenChange={(open) => { if (!open) setDialog({ type: "none" }); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete album?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{dialog.album.title}" and all its media. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(dialog.album.id)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Album"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default AdminAlbums;
