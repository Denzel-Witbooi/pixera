import React, { useState, useRef } from "react";
import { Album } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Loader2, Upload, X, FileImage, FileVideo } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatFileSize, isValidFileType, isWithinSizeLimit } from "@/lib/storage-helpers";
import LoadingOverlay from "@/components/LoadingOverlay";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (albumData: Partial<Album>, files: File[]) => Promise<void>;
  initialAlbum?: Album;
  mode?: "create-new" | "add-to-existing";
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCreateAlbum,
  initialAlbum,
  mode = "create-new"
}) => {
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadState } = useImageUpload();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    setError(null);
    
    const invalidFiles = files.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(", ")}`);
      return;
    }
    
    const oversizedFiles = files.filter(file => !isWithinSizeLimit(file));
    if (oversizedFiles.length > 0) {
      setError(`File(s) exceed size limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }
    
    if (mode === "create-new" && !albumTitle.trim()) {
      setError("Please enter an album title");
      return;
    }
    
    try {
      await onCreateAlbum(
        mode === "create-new" 
          ? { title: albumTitle, description: albumDescription }
          : initialAlbum || {},
        selectedFiles
      );
      
      setAlbumTitle("");
      setAlbumDescription("");
      setSelectedFiles([]);
      setError(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const title = mode === "create-new" 
    ? "Create New Album" 
    : "Add to Album";
  
  const description = mode === "create-new"
    ? "Upload photos and videos to create a new album."
    : `Add photos and videos to "${initialAlbum?.title}".`;

  return (
    <>
      <LoadingOverlay 
        isLoading={uploadState.isUploading}
        progress={uploadState.progress}
        message={mode === "create-new" ? "Creating album..." : "Adding to album..."}
        completedItems={uploadState.completedUploads}
        totalItems={uploadState.totalUploads}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "create-new" && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Album Title</Label>
                    <Input
                      id="title"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="Enter album title"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={albumDescription}
                      onChange={(e) => setAlbumDescription(e.target.value)}
                      placeholder="Enter album description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                <Separator />
              </>
            )}
            
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadState.isUploading}
                />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports images and videos up to 100MB
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {uploadState.isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Uploading media...</span>
                    <span>
                      {uploadState.completedUploads} of {uploadState.totalUploads} complete
                    </span>
                  </div>
                  <Progress

