
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { MOCK_USER_ID } from "@/lib/mock-data";
import type { BackendType } from "@/lib/adapter";

type UserWithRole = User & {
  role?: string;
};

type AuthContextType = {
  session: Session | null;
  user: UserWithRole | null;
  isLoading: boolean;
  isPublicView: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchToPublicView: () => void;
  switchToAuthView: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Local mock user (bypasses Supabase when VITE_USE_LOCAL_DATA=true) ──────────

const MOCK_USER: UserWithRole = {
  id: MOCK_USER_ID,
  email: "admin@test.local",
  role: "admin",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
};

const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPublicView, setIsPublicView] = useState(false);

  const noOp = async () => {};

  return (
    <AuthContext.Provider
      value={{
        session: null,
        user: MOCK_USER,
        isLoading: false,
        isPublicView,
        isAdmin: true,
        signIn: noOp,
        signUp: noOp,
        signOut: async () => setIsPublicView(true),
        switchToPublicView: () => setIsPublicView(true),
        switchToAuthView: () => setIsPublicView(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Supabase auth provider (production) ───────────────────────────────────────

const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return;
      }

      if (data && data.role) {
        setUser((prev) => (prev ? { ...prev, role: data.role } : null));
        setIsAdmin(data.role === "admin");
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession) {
        setIsPublicView(false);
        fetchUserRole(newSession.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchUserRole(currentSession.user.id);
      }

      setIsLoading(false);

      if (!currentSession) {
        setIsPublicView(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({
        title: "Sign up successful",
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again with a different email.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isPublicView,
        isAdmin,
        signIn,
        signUp,
        signOut,
        switchToPublicView: () => setIsPublicView(true),
        switchToAuthView: () => setIsPublicView(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Exported provider — picks the right implementation ────────────────────────

export const AuthProvider: React.FC<{ backend: BackendType; children: React.ReactNode }> = ({
  backend,
  children,
}) =>
  backend === "local" ? (
    <LocalAuthProvider>{children}</LocalAuthProvider>
  ) : (
    <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  );

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
