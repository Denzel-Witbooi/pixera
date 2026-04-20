
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdapterProvider } from "@/contexts/AdapterContext";
import { createAdapter, type BackendType } from "@/lib/adapter";
import Index from "./pages/Index";
import Album from "./pages/Album";
import Auth from "./pages/Auth";
import CreateAlbum from "./pages/CreateAlbum";
import NotFound from "./pages/NotFound";
import GalleryHome from "./pages/GalleryHome";
import GalleryAlbum from "./pages/GalleryAlbum";
import GalleryNotFound from "./pages/GalleryNotFound";

// ── Single decision point for backend selection ───────────────────────────────
const backend: BackendType =
  import.meta.env.VITE_USE_LOCAL_DATA === "true" ? "local" : "dotnet";
const adapter = createAdapter(backend);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — data considered fresh
      gcTime: 30 * 60 * 1000,     // 30 minutes — keep unused data in cache
      retry: 1,
    },
  },
});

// Protected route component that now supports public viewing
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isPublicView } = useAuth();
  
  if (isLoading) return null;
  
  // Allow access if user is authenticated or in public view mode
  if (!user && !isPublicView) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Admin-only route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) return null;
  
  // Only allow access if user is authenticated and has admin role
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Make sure App is a proper React function component
function App() {
  return (
    // Ensure the QueryClientProvider is properly nested
    <QueryClientProvider client={queryClient}>
      <AdapterProvider adapter={adapter}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider backend={backend}>
              <AppRoutes />
              <Toaster />
              <Sonner />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AdapterProvider>
    </QueryClientProvider>
  );
}

// Separate AppRoutes component to ensure hooks are used correctly
const AppRoutes = () => (
  <Routes>
    {/* Public gallery — no auth */}
    <Route path="/gallery" element={<GalleryHome />} />
    <Route path="/gallery/:id/:slug" element={<GalleryAlbum />} />
    <Route path="/gallery/not-found" element={<GalleryNotFound />} />

    {/* Legacy authenticated routes */}
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/album/:id" element={<ProtectedRoute><Album /></ProtectedRoute>} />
    <Route path="/create-album" element={<AdminRoute><CreateAlbum /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
