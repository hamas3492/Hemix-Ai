import { supabase } from "@/lib/supabase-client";
import type { User } from "@/types";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

function translateAuthError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const msg = typeof error === "string" ? error : error.message || "An unexpected error occurred.";

  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("invalid password")
  ) {
    return "Invalid email or password.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user_already_exists")
  ) {
    return "An account with this email already exists.";
  }
  if (
    lower.includes("token has expired") ||
    lower.includes("otp_expired") ||
    lower.includes("expired")
  ) {
    return "The verification code has expired. Please request a new code.";
  }
  if (
    lower.includes("invalid token") ||
    lower.includes("token_invalid") ||
    lower.includes("otp_invalid")
  ) {
    return "Invalid verification code. Please check and try again.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  return msg;
}

export function mapSupabaseUser(authUser: any): User {
  if (!authUser) {
    throw new Error("No user object provided for mapping.");
  }
  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    email: authUser.email || "",
    avatar: authUser.user_metadata?.avatar || undefined,
    plan: (authUser.user_metadata?.plan as "free" | "pro" | "enterprise") || "free",
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}

export const authService = {
  /**
   * Step 1 Signup: Create user with metadata and send OTP code to email.
   */
  async signup(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          plan: "free",
        },
      },
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }

    const user = data.user ? mapSupabaseUser(data.user) : null;
    return { user, session: data.session };
  },

  /**
   * Verify signup OTP token.
   */
  async verifyOTP(email: string, token: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      // Fallback attempt with type 'email' or 'magiclink' if configured differently in Supabase
      const { data: fallbackData, error: fallbackError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (fallbackError || !fallbackData.user) {
        throw new Error(translateAuthError(error));
      }
      return mapSupabaseUser(fallbackData.user);
    }

    if (!data.user) {
      throw new Error("Verification failed. Please try signing up again.");
    }

    return mapSupabaseUser(data.user);
  },

  /**
   * Email + password login.
   */
  async login(email: string, password: string, remember: boolean = true): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }

    if (!data.user) {
      throw new Error("Login failed. User profile not found.");
    }

    return mapSupabaseUser(data.user);
  },

  /**
   * Passwordless login via email OTP.
   */
  async loginWithOTP(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }
  },

  /**
   * Verify login OTP token.
   */
  async verifyLoginOTP(email: string, token: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      // Try magiclink fallback
      const { data: fallbackData, error: fallbackError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "magiclink",
      });

      if (fallbackError || !fallbackData.user) {
        throw new Error(translateAuthError(error));
      }
      return mapSupabaseUser(fallbackData.user);
    }

    if (!data.user) {
      throw new Error("Verification failed. User session not found.");
    }

    return mapSupabaseUser(data.user);
  },

  /**
   * Passwordless login via SMS OTP to an existing account.
   * Fails if no account exists for this phone number (shouldCreateUser: false).
   */
  async loginWithPhoneOTP(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }
  },

  /**
   * Sends an SMS OTP for phone signup — creates the account if it doesn't exist.
   */
  async signupWithPhoneOTP(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }
  },

  /**
   * Verify an SMS OTP code (works for both phone login and phone signup —
   * Supabase treats them the same way once the code is sent).
   */
  async verifyPhoneOTP(phone: string, token: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }

    if (!data.user) {
      throw new Error("Verification failed. Please try again.");
    }

    return mapSupabaseUser(data.user);
  },

  /**
   * Kick off Google OAuth sign-in. On web this redirects the full page and
   * returns nothing useful (browser navigates away). On native, pass
   * skipRedirect=true to get back the auth URL to open in an in-app browser
   * instead — the native shell handles the deep-link callback separately.
   */
  async signInWithGoogle(redirectTo: string, skipRedirect = false): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: skipRedirect,
      },
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }

    return data?.url || null;
  },

  /**
   * Request password reset email.
   */
  async resetPassword(email: string): Promise<void> {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/forgot-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }
  },

  /**
   * Request password reset alias for backward compatibility.
   */
  async requestPasswordReset(email: string): Promise<void> {
    return this.resetPassword(email);
  },

  /**
   * Sign out of Supabase auth.
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(translateAuthError(error));
    }
  },

  /**
   * Get active session user.
   */
  async getSession(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return null;
    }
    return mapSupabaseUser(data.session.user);
  },

  /**
   * Update profile metadata in Supabase auth.
   */
  async updateProfile(
    updates: Partial<Pick<User, "name" | "avatar" | "plan">>
  ): Promise<User | null> {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      throw new Error(translateAuthError(error));
    }

    if (!data.user) return null;
    return mapSupabaseUser(data.user);
  },

  /**
   * Listen for auth changes.
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, user: User | null) => void
  ) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? mapSupabaseUser(session.user) : null;
      callback(event, user);
    });
  },

  /**
   * Delete account wrapper for backward compatibility.
   */
  async deleteAccount(): Promise<void> {
    await this.logout();
  },
};

export default authService;
