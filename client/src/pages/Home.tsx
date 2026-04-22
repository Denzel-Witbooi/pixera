import React from "react";
import { Link } from "react-router-dom";
import { Images, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedbackFAB from "@/components/FeedbackFAB";

const Home: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Header */}
    <header className="border-b">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center">
        <Link to="/">
          <img src="/logoipsum-custom-logo.svg" alt="Pixera" className="h-10" />
        </Link>
      </div>
    </header>

    {/* Hero */}
    <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
        Communications Department
      </span>
      <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">
        Pixera Gallery
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Browse, download, and share your organisation's media collections.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" asChild>
          <Link to="/gallery" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Browse Gallery
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/admin" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Admin Login
          </Link>
        </Button>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Pixera — Communications Department
    </footer>

    <FeedbackFAB />
  </div>
);

export default Home;
