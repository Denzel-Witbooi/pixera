
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AlbumNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-medium mb-4">Album not found</h1>
      <p className="text-muted-foreground mb-6">
        The album you're looking for doesn't exist or has been deleted.
      </p>
      <Link to="/">
        <Button>Return to Gallery</Button>
      </Link>
    </div>
  );
};

export default AlbumNotFound;
