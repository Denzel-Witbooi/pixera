import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X, Upload, Image as ImageIcon, Film, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAdapter } from "@/contexts/AdapterContext";
import { useImageUpload } from "@/hooks/useImageUpload";
import { createPreviewUrl, formatFileSize, getMediaType, isValidFileType, revokePreviewUrl } from "@/lib/storage-helpers";
import { Card, CardContent } from "@/components/ui/card";
import LoadingOverlay from "@/components/LoadingOverlay";

interface MediaPreview {
  file: File;
  type: 'image' | 'video';
  url: string;
  id: string;
}

const CreateAlbum = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const adapter = useAdapter();
  const { uploadToStorage, uploadState } = useImageUpload();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an album.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const newPreviews = files.map((file, index) => ({
      file,
      type: getMediaType(file),
      url: createPreviewUrl(file),
      id: `preview-${index}`
    }));
    
    setPreviews(newPreviews);
    
    if (files.length > 0 && selectedCoverIndex === null) {
      setSelectedCoverIndex(0);
    }
    
    return () => {
      previews.forEach(preview => {
        revokePreviewUrl(preview.url);
      });
    };
  }, [files]);
  
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
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        isValidFileType(file)
      );
      
      if (newFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please upload only images or videos.",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => 
        isValidFileType(file)
      );
      
      if (newFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please upload only images or videos.",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const removedPreview = previews[index];
    if (removedPreview) {
      revokePreviewUrl(removedPreview.url);
    }
    
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    if (selectedCoverIndex === index) {
      if (files.length > 1) {
        setSelectedCoverIndex(index === 0 ? 1 : 0);
      } else {
        setSelectedCoverIndex(null);
      }
    } else if (selectedCoverIndex !== null && selectedCoverIndex > index) {
      setSelectedCoverIndex(selectedCoverIndex - 1);
    }
  };

  const selectAsCover = (index: number) => {
    setSelectedCoverIndex(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your album.",
        variant: "destructive"
      });
      return;
    }
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image or video.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedCoverIndex === null) {
      toast({
        title: "Cover image required",
        description: "Please select a cover image for your album.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const albumId = uuidv4();
      const newAlbum = await adapter.createAlbum({
        id: albumId,
        title,
        description: description || "",
        coverUrl: "",
        userId: user.id,
        createdAt: new Date().toISOString(),
      });

      const mediaItems = await uploadToStorage(files, newAlbum.id);

      if (mediaItems.length > 0 && selectedCoverIndex !== null) {
        try {
          await adapter.updateAlbumCover(newAlbum.id, mediaItems[selectedCoverIndex].url);
        } catch (updateError) {
          console.error("Error updating album cover:", updateError);
        }
      }
      
      toast({
        title: "Album created",
        description: `Successfully created "${title}" with ${mediaItems.length} items.`
      });
      
      navigate(`/album/${newAlbum.id}`);
    } catch (error) {
      console.error("Failed to create album:", error);
      toast({
        title: "Failed to create album",
        description: "There was an error creating your album. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    previews.forEach(preview => {
      revokePreviewUrl(preview.url);
    });
    
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <LoadingOverlay 
        isLoading={isUploading || uploadState.isUploading}
        progress={uploadState.progress}
        message="Creating your album..."
        completedItems={uploadState.completedUploads}
        totalItems={uploadState.totalUploads}
      />
      
      <Header />
      
      <main className="container max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold mb-6">Create New Album</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="albumTitle">Album Name</Label>
                <Input
                  id="albumTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter album name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your album"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  id="private-mode"
                />
                <Label htmlFor="private-mode">Private Album</Label>
                <span className="text-xs text-muted-foreground ml-2">
                  Anyone can view this album with the link
                </span>
              </div>
              
              <div className="pt-4 border-t">
                <h2 className="text-lg font-medium mb-3">Upload Photos & Videos</h2>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4",
                    dragActive ? "border-primary bg-primary/5" : "border-border",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Supports: JPG, PNG, GIF, MP4, WebM (max 100MB)
                  </p>
                  <Input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,video/*"
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => document.getElementById("fileUpload")?.click()}
                    className="mt-2"
                  >
                    Select Files
                  </Button>
                </div>
                
                {previews.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {previews.map((preview, index) => (
                        <div key={preview.id} className="relative group rounded-md overflow-hidden border bg-background">
                          <AspectRatio ratio={1}>
                            {preview.type === 'image' ? (
                              <img 
                                src={preview.url} 
                                alt={preview.file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full">
                                <video 
                                  src={preview.url} 
                                  className="w-full h-full object-cover"
                                  poster="" 
                                />
                                <Film className="absolute h-8 w-8 text-primary/70" />
                              </div>
                            )}
                          </AspectRatio>
                          
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 bg-white/80 hover:bg-white", 
                                  selectedCoverIndex === index && "border-primary border-2"
                                )}
                                onClick={() => selectAsCover(index)}
                              >
                                <ImageIcon className={cn(
                                  "h-4 w-4", 
                                  selectedCoverIndex === index ? "text-primary" : "text-foreground"
                                )} />
                              </Button>
                            </div>
                          </div>
                          
                          {selectedCoverIndex === index && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                            {preview.file.name.substring(0, 20)}{preview.file.name.length > 20 ? '...' : ''}
                            <span className="block text-[9px] opacity-75">
                              {formatFileSize(preview.file.size)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {previews.length > 0 && (
                <div className="pt-4 border-t">
                  <h2 className="text-lg font-medium mb-3">Album Cover</h2>
                  
                  {selectedCoverIndex !== null ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-24 h-24 relative rounded-md overflow-hidden border">
                        {previews[selectedCoverIndex].type === 'image' ? (
                          <img 
                            src={previews[selectedCoverIndex].url} 
                            alt="Album cover preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-black/10">
                            <Film className="h-10 w-10 text-primary/70" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Selected as album cover</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can change it by selecting a different image above
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select an image to use as the album cover
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading || !title || files.length === 0 || selectedCoverIndex === null}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-pulse">Creating Album...</span>
                    </>
                  ) : (
                    "Create Album"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateAlbum;
