import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GalleryNotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
    <h1 className="text-5xl font-medium">404</h1>
    <p className="text-xl text-muted-foreground">This album doesn't exist or the link has changed.</p>
    <Button asChild variant="outline">
      <Link to="/gallery">Back to Gallery</Link>
    </Button>
  </div>
);

export default GalleryNotFound;
