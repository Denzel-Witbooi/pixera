
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X, Image as ImageIcon, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isPublicView, isAdmin } = useAuth();
  const { isMobile } = useIsMobile();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close menu when location changes
    setMenuOpen(false);
  }, [location]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
  };

  const handleSignIn = () => {
    closeMenu();
    navigate("/auth");
  };
  
  const handleCreateAlbum = () => {
    closeMenu();
    navigate("/create-album");
  };
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 flex items-center justify-between",
        scrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <span className="text-lg sm:text-xl font-medium">VodaPix</span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-4">
        <Link 
          to="/" 
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === "/" ? "text-primary" : "text-foreground/80"
          )}
        >
          Gallery
        </Link>
        
        {/* Only show Create Album for admin users */}
        {user && isAdmin && (
          <Button 
            onClick={handleCreateAlbum} 
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="w-4 h-4" />
            <span>Create Album</span>
          </Button>
        )}
        
        {user ? (
          <Button 
            onClick={handleSignOut} 
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        ) : (
          <Button 
            onClick={handleSignIn} 
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        )}
      </nav>
      
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-foreground p-1.5 rounded-lg" 
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        {menuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/98 backdrop-blur-sm animate-fade-in pt-16">
          <nav className="flex flex-col items-center space-y-6 p-8">
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
            
            {/* Only show Create Album for admin users */}
            {user && isAdmin && (
              <Button 
                onClick={handleCreateAlbum}
                className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                <span>Create Album</span>
              </Button>
            )}
            
            {user ? (
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
