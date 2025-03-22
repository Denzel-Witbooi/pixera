
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const Header: React.FC<{ openUploadModal: () => void }> = ({ openUploadModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 flex items-center justify-between",
        scrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Image className="w-8 h-8 text-primary" />
          <span className="text-xl font-medium">VodaPix</span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-8">
        <Link 
          to="/" 
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === "/" ? "text-primary" : "text-foreground/80"
          )}
        >
          Gallery
        </Link>
        <Button 
          onClick={openUploadModal} 
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          <span>Create Album</span>
        </Button>
      </nav>
      
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-foreground p-2" 
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        {menuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background animate-fade-in pt-20">
          <nav className="flex flex-col items-center space-y-8 p-8">
            <Link 
              to="/" 
              className={cn(
                "text-lg font-medium transition-colors hover:text-primary",
                location.pathname === "/" ? "text-primary" : "text-foreground/80"
              )}
              onClick={closeMenu}
            >
              Gallery
            </Link>
            <Button 
              onClick={() => {
                closeMenu();
                openUploadModal();
              }} 
              className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span>Create Album</span>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
