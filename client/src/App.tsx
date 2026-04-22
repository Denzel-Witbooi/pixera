
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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

// Admin section — lazy loaded so it never appears in the gallery bundle
const KeycloakGuard = React.lazy(() => import("./components/admin/KeycloakGuard"));
const AdminPanel = React.lazy(() => import("./pages/admin/AdminPanel"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAlbums = React.lazy(() => import("./pages/admin/AdminAlbums"));
const AdminAlbumDetail = React.lazy(() => import("./pages/admin/AdminAlbumDetail"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
    <Route path="/gallery/:slug" element={<GalleryAlbum />} />
    <Route path="/gallery/not-found" element={<GalleryNotFound />} />

    {/* Admin section — separate lazy chunk, guarded by Keycloak */}
    <Route path="/admin" element={
      <Suspense fallback={<AdminFallback />}>
        <KeycloakGuard>
          <AdminPanel />
        </KeycloakGuard>
      </Suspense>
    }>
      <Route index element={
        <Suspense fallback={<AdminFallback />}>
          <AdminDashboard />
        </Suspense>
      } />
      <Route path="albums" element={
        <Suspense fallback={<AdminFallback />}>
          <AdminAlbums />
        </Suspense>
      } />
      <Route path="albums/:slug" element={
        <Suspense fallback={<AdminFallback />}>
          <AdminAlbumDetail />
        </Suspense>
      } />
    </Route>

    {/* Legacy authenticated routes */}
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/album/:id" element={<ProtectedRoute><Album /></ProtectedRoute>} />
    <Route path="/create-album" element={<AdminRoute><CreateAlbum /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
