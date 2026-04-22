
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AdapterProvider } from "@/contexts/AdapterContext";
import { createAdapter, type BackendType } from "@/lib/adapter";
import Home from "./pages/Home";
import GalleryHome from "./pages/GalleryHome";
import GalleryAlbum from "./pages/GalleryAlbum";
import GalleryNotFound from "./pages/GalleryNotFound";
import NotFound from "./pages/NotFound";

// Admin section — lazy loaded so it never appears in the gallery bundle
const KeycloakGuard  = React.lazy(() => import("./components/admin/KeycloakGuard"));
const AdminPanel     = React.lazy(() => import("./pages/admin/AdminPanel"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAlbums    = React.lazy(() => import("./pages/admin/AdminAlbums"));
const AdminAlbumDetail = React.lazy(() => import("./pages/admin/AdminAlbumDetail"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const backend: BackendType =
  import.meta.env.VITE_USE_LOCAL_DATA === "true" ? "local" : "dotnet";
const adapter = createAdapter(backend);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    30 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdapterProvider adapter={adapter}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<GalleryHome />} />
              <Route path="/gallery/:slug" element={<GalleryAlbum />} />
              <Route path="/gallery/not-found" element={<GalleryNotFound />} />

              {/* Admin — lazy, Keycloak-guarded */}
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

              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AdapterProvider>
    </QueryClientProvider>
  );
}

export default App;
