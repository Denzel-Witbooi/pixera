
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Album from "./pages/Album";
import Auth from "./pages/Auth";
import CreateAlbum from "./pages/CreateAlbum";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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

// Separate AppRoutes component to ensure hooks are used correctly
const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/album/:id" element={<ProtectedRoute><Album /></ProtectedRoute>} />
    <Route path="/create-album" element={<AdminRoute><CreateAlbum /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Make sure App is a proper React function component
function App() {
  return (
    // Ensure the QueryClientProvider is properly nested
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
