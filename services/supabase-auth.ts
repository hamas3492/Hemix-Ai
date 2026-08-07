import { supabase } from "@/lib/supabase-client";
import type { User } from "@/types";

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Failed to create account.");
  }

  const profileData = {
    id: data.user.id,
    name,
    avatar: null,
    plan: "free",
    created_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "id" });

  if (profileError) {
    console.warn("Could not upsert profile after sign up:", profileError.message);
  }

  return {
    id: data.user.id,
    name,
    email: data.user.email || email,
    avatar: undefined,
    plan: "free",
    createdAt: data.user.created_at || new Date().toISOString(),
  };
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Sign in failed.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return {
    id: data.user.id,
    name: profile?.name || data.user.user_metadata?.name || email.split("@")[0],
    email: data.user.email || email,
    avatar: profile?.avatar || undefined,
    plan: (profile?.plan as "free" | "pro" | "enterprise") || "free",
    createdAt: profile?.created_at || data.user.created_at || new Date().toISOString(),
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSession(): Promise<User | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session || !session.user) {
    return null;
  }

  const authUser = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return {
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    email: authUser.email || "",
    avatar: profile?.avatar || undefined,
    plan: (profile?.plan as "free" | "pro" | "enterprise") || "free",
    createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
  };
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset-password`
        : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfile(
  updates: Partial<Pick<User, "name" | "avatar" | "plan">>
): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No active session found.");
  }

  const profileUpdates: Record<string, any> = {};
  if (updates.name !== undefined) profileUpdates.name = updates.name;
  if (updates.avatar !== undefined) profileUpdates.avatar = updates.avatar;
  if (updates.plan !== undefined) profileUpdates.plan = updates.plan;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (updates.name) {
    await supabase.auth.updateUser({
      data: { name: updates.name },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name || updates.name || user.user_metadata?.name || "User",
    email: user.email || "",
    avatar: profile?.avatar || undefined,
    plan: (profile?.plan as "free" | "pro" | "enterprise") || "free",
    createdAt: profile?.created_at || user.created_at || new Date().toISOString(),
  };
}

export async function deleteAccount(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No active session found.");
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (error) {
    console.error("Error deleting profile:", error.message);
  }

  await supabase.auth.signOut();
}

export const supabaseAuth = {
  signUp,
  signIn,
  signOut,
  getSession,
  resetPassword,
  updateProfile,
  deleteAccount,
};

export default supabaseAuth;
