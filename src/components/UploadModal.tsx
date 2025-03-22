
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2, Image, Film } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createPreviewUrl, formatFileSize, getMediaType, isValidFileType, revokePreviewUrl } from "@/lib/storage-helpers";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (album: any, files: File[]) => Promise<void>;
}

interface MediaPreview {
  file: File;
  type: 'image' | 'video';
  url: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onCreateAlbum }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "media">("details");
  const { toast } = useToast();
  
  useEffect(() => {
    // Update previews when files change
    const newPreviews = files.map(file => ({
      file,
      type: getMediaType(file),
      url: createPreviewUrl(file)
    }));
    
    setPreviews(newPreviews);
    
    // Clean up preview URLs when component unmounts or files change
    return () => {
      previews.forEach(preview => {
        revokePreviewUrl(preview.url);
      });
    };
  }, [files]);
  
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      previews.forEach(preview => {
        revokePreviewUrl(preview.url);
      });
    };
  }, []);
  
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
      setActiveTab("media");
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
      if (newFiles.length > 0) {
        setActiveTab("media");
      }
    }
  };

  const removeFile = (index: number) => {
    const removedPreview = previews[index];
    if (removedPreview) {
      revokePreviewUrl(removedPreview.url);
    }
    
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your album.",
        variant: "destructive"
      });
      setActiveTab("details");
      return;
    }
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image or video.",
        variant: "destructive"
      });
      setActiveTab("media");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const newAlbum = {
        id: uuidv4(),
        title,
        description,
        createdAt: new Date().toISOString()
      };
      
      await onCreateAlbum(newAlbum, files);
      
      toast({
        title: "Album created",
        description: "Your album has been created successfully."
      });
      
      setTitle("");
      setDescription("");
      setFiles([]);
      setPreviews([]);
      onClose();
    } catch (error) {
      toast({
        title: "Failed to create album",
        description: "There was an error creating your album. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to create album:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs before closing
    previews.forEach(preview => {
      revokePreviewUrl(preview.url);
    });
    setPreviews([]);
    setFiles([]);
    setTitle("");
    setDescription("");
    setActiveTab("details");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-medium">Create New Album</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "media")} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">
              Album Details
            </TabsTrigger>
            <TabsTrigger value="media" className="flex gap-2 items-center">
              Media
              {files.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {files.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <TabsContent value="details" className="flex-1 overflow-hidden flex flex-col m-0">
              <ScrollArea className="pr-4 flex-1">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Album Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter album title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter album description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Upload Media</Label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
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
                        variant="outline"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                        className="mt-2"
                      >
                        Select Files
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="media" className="flex-1 overflow-hidden flex flex-col m-0">
              <div className="flex items-center justify-between mb-3">
                <Label>{files.length} file(s) selected</Label>
                {files.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("fileUpload")?.click()}
                  >
                    Add More
                  </Button>
                )}
              </div>
              
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">No media files selected</p>
                  <Button
                    type="button"
                    onClick={() => document.getElementById("fileUpload")?.click()}
                  >
                    Select Files
                  </Button>
                </div>
              ) : (
                <ScrollArea className="pr-4 flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border bg-background">
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
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                          {preview.file.name.substring(0, 20)}{preview.file.name.length > 20 ? '...' : ''}
                          <span className="block text-[9px] opacity-75">
                            {formatFileSize(preview.file.size)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => document.getElementById("fileUpload")?.click()}
                      className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-full min-h-[100px] cursor-pointer p-2 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add More</span>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <DialogFooter className="pt-4 mt-4 flex-shrink-0 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Album"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
