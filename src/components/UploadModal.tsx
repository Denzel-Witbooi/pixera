
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (album: any, files: File[]) => Promise<void>;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onCreateAlbum }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  
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
        file.type.startsWith("image/") || file.type.startsWith("video/")
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
        file.type.startsWith("image/") || file.type.startsWith("video/")
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-medium">Create New Album</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
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
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>{files.length} file(s) selected</Label>
                  <div className="border rounded-lg divide-y">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3">
                        <div className="flex items-center space-x-2 truncate">
                          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                            {file.type.startsWith("image/") ? (
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={file.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : (
                              <span className="text-xs">Video</span>
                            )}
                          </div>
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4 mt-4 flex-shrink-0 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
