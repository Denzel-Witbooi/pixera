import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import keycloak from "@/lib/keycloak";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    keycloak.logout({ redirectUri: `${window.location.origin}/gallery` });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <Link to="/admin" className="font-semibold text-lg">
              Pixera Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {keycloak.tokenParsed?.preferred_username && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {keycloak.tokenParsed.preferred_username}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPanel;
