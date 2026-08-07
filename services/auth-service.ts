import type { User } from "@/types";
import { nanoid } from "nanoid";

const STORAGE_KEY = "hemix-auth";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEY}-users`) || "[]");
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY}-users`, JSON.stringify(users));
}

function setSession(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(`${STORAGE_KEY}-session`, JSON.stringify(user));
  } else {
    localStorage.removeItem(`${STORAGE_KEY}-session`);
  }
}

export const authService = {
  signup(name: string, email: string, password: string): User {
    const users = getStoredUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user: StoredUser = {
      id: nanoid(),
      name,
      email,
      password: btoa(password),
      avatar: undefined,
      plan: "free",
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveStoredUsers(users);
    const sessionUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      createdAt: user.createdAt,
    };
    setSession(sessionUser);
    return sessionUser;
  },

  login(email: string, password: string, remember: boolean): User {
    const users = getStoredUsers();
    const user = users.find((u) => u.email === email);
    if (!user || user.password !== btoa(password)) {
      throw new Error("Invalid email or password.");
    }
    const sessionUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      createdAt: user.createdAt,
    };
    if (!remember) {
      sessionStorage.setItem(`${STORAGE_KEY}-session`, JSON.stringify(sessionUser));
    } else {
      setSession(sessionUser);
    }
    return sessionUser;
  },

  logout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${STORAGE_KEY}-session`);
    sessionStorage.removeItem(`${STORAGE_KEY}-session`);
  },

  getSession(): User | null {
    if (typeof window === "undefined") return null;
    const local = localStorage.getItem(`${STORAGE_KEY}-session`);
    const session = sessionStorage.getItem(`${STORAGE_KEY}-session`);
    const raw = local || session;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  requestPasswordReset(email: string): void {
    const users = getStoredUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error("No account found with this email.");
    }
    // In production, send email with reset link
  },

  updateProfile(updates: Partial<Pick<User, "name" | "avatar">>): User | null {
    const session = this.getSession();
    if (!session) return null;
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === session.id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    saveStoredUsers(users);
    const updated: User = { ...session, ...updates };
    setSession(updated);
    return updated;
  },

  deleteAccount(): void {
    const session = this.getSession();
    if (!session) return;
    const users = getStoredUsers().filter((u) => u.id !== session.id);
    saveStoredUsers(users);
    this.logout();
  },
};
