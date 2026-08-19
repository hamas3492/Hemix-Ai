"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@/types";
import { authService } from "@/services/auth-service";
import { useChatStore } from "@/lib/store";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  loginWithOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<User>;
  verifyLoginOTP: (email: string, token: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<{ user: User | null; session: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "avatar">>) => Promise<User | null>;
  loginWithPhoneOTP: (phone: string) => Promise<void>;
  signupWithPhoneOTP: (phone: string) => Promise<void>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<User>;
  signInWithGoogle: (redirectTo: string, skipRedirect?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUser = useChatStore((s) => s.setUser);

  useEffect(() => {
    let isMounted = true;

    authService
      .getSession()
      .then((sessionUser) => {
        if (isMounted) {
          setUser(sessionUser);
          setStoreUser(sessionUser);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching auth session:", err);
        if (isMounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, sessionUser) => {
      if (isMounted) {
        setUser(sessionUser);
        setStoreUser(sessionUser);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setStoreUser]);

  const login = async (email: string, password: string, remember = true) => {
    setLoading(true);
    try {
      const u = await authService.login(email, password, remember);
      setUser(u);
      setStoreUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (email: string) => {
    setLoading(true);
    try {
      await authService.loginWithOTP(email);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    setLoading(true);
    try {
      const u = await authService.verifyOTP(email, token);
      setUser(u);
      setStoreUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOTP = async (email: string, token: string) => {
    setLoading(true);
    try {
      const u = await authService.verifyLoginOTP(email, token);
      setUser(u);
      setStoreUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.signup(name, email, password);
      if (res.user) {
        setUser(res.user);
        setStoreUser(res.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setStoreUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await authService.resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPhoneOTP = async (phone: string) => {
    setLoading(true);
    try {
      await authService.loginWithPhoneOTP(phone);
    } finally {
      setLoading(false);
    }
  };

  const signupWithPhoneOTP = async (phone: string) => {
    setLoading(true);
    try {
      await authService.signupWithPhoneOTP(phone);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOTP = async (phone: string, token: string) => {
    setLoading(true);
    try {
      const u = await authService.verifyPhoneOTP(phone, token);
      setUser(u);
      setStoreUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (redirectTo: string, skipRedirect = false) => {
    return authService.signInWithGoogle(redirectTo, skipRedirect);
  };

  const updateProfile = async (updates: Partial<Pick<User, "name" | "avatar">>) => {
    const updated = await authService.updateProfile(updates);
    if (updated) {
      setUser(updated);
      setStoreUser(updated);
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithOTP,
        verifyOTP,
        verifyLoginOTP,
        signup,
        logout,
        resetPassword,
        updateProfile,
        loginWithPhoneOTP,
        signupWithPhoneOTP,
        verifyPhoneOTP,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
