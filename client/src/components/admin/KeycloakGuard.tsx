import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import keycloak from "@/lib/keycloak";

interface KeycloakGuardProps {
  children: React.ReactNode;
}

const KeycloakGuard: React.FC<KeycloakGuardProps> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // onLoad: "login-required" — Keycloak redirects to the login page if there
    // is no active session. The promise only resolves when a session exists.
    keycloak
      .init({ onLoad: "login-required", pkceMethod: "S256" })
      .then(() => setReady(true))
      .catch(console.error);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default KeycloakGuard;
