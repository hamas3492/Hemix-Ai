"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types";
import { authService } from "@/services/auth-service";
import { useChatStore } from "@/lib/store";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "avatar">>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUser = useChatStore((s) => s.setUser);

  useEffect(() => {
    const session = authService.getSession();
    setUser(session);
    setStoreUser(session);
    setLoading(false);
  }, [setStoreUser]);

  const login = async (email: string, password: string, remember: boolean) => {
    const u = authService.login(email, password, remember);
    setUser(u);
    setStoreUser(u);
    return u;
  };

  const signup = async (name: string, email: string, password: string) => {
    const u = authService.signup(name, email, password);
    setUser(u);
    setStoreUser(u);
    return u;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setStoreUser(null);
  };

  const updateProfile = (updates: Partial<Pick<User, "name" | "avatar">>) => {
    const updated = authService.updateProfile(updates);
    if (updated) {
      setUser(updated);
      setStoreUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
