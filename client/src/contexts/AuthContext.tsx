
import React, { createContext, useContext, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_USER_ID } from "@/lib/mock-data";
import type { BackendType } from "@/lib/adapter";

type UserWithRole = {
  id: string;
  email: string;
  role?: string;
};

type AuthContextType = {
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

const MOCK_USER: UserWithRole = {
  id: MOCK_USER_ID,
  email: "admin@test.local",
  role: "admin",
};

const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPublicView, setIsPublicView] = useState(false);
  const noOp = async () => {};

  return (
    <AuthContext.Provider
      value={{
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

const DotNetAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPublicView, setIsPublicView] = useState(false);
  const { toast } = useToast();

  const signIn = async (_email: string, _password: string) => {
    toast({ title: "Auth not implemented", description: "Coming in a future phase." });
  };

  return (
    <AuthContext.Provider
      value={{
        user: MOCK_USER,
        isLoading: false,
        isPublicView,
        isAdmin: true,
        signIn,
        signUp: signIn,
        signOut: async () => setIsPublicView(true),
        switchToPublicView: () => setIsPublicView(true),
        switchToAuthView: () => setIsPublicView(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ backend: BackendType; children: React.ReactNode }> = ({
  backend,
  children,
}) =>
  backend === "local" ? (
    <LocalAuthProvider>{children}</LocalAuthProvider>
  ) : (
    <DotNetAuthProvider>{children}</DotNetAuthProvider>
  );

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
