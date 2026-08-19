"use client";

import { isNativeApp } from "@/hooks/useNativePlatform";
import { authService } from "@/services/auth-service";
import { supabase } from "@/lib/supabase-client";

/**
 * The custom URL scheme Google/Supabase redirects back to once the native
 * app's OAuth consent flow finishes. Must match android:scheme in
 * AndroidManifest.xml and capacitor.config.ts's appId.
 */
export const NATIVE_OAUTH_REDIRECT = "com.hemix.ai://auth/callback";

/**
 * Starts the "Continue with Google" flow.
 *
 * - Web: full-page redirect through Supabase's OAuth flow, landing back on
 *   /auth/callback which finalizes the session.
 * - Native (Capacitor): opens the Google consent screen in an in-app browser
 *   (@capacitor/browser) and waits for the app to receive the deep-link
 *   redirect (handled by the appUrlOpen listener in useNativeInit.ts), which
 *   contains the access/refresh tokens.
 */
export async function signInWithGoogle(): Promise<void> {
  if (isNativeApp()) {
    const { Browser } = await import("@capacitor/browser");
    const url = await authService.signInWithGoogle(NATIVE_OAUTH_REDIRECT, true);
    if (!url) throw new Error("Could not start Google sign-in. Please try again.");
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  await authService.signInWithGoogle(redirectTo || "", false);
  // Web: signInWithOAuth navigates the page away — nothing else to do here.
}

/**
 * Consumes a deep-link callback URL (native only) — pulls the access/refresh
 * tokens out of the URL fragment/query and establishes the Supabase session.
 * Returns true if a session was successfully set.
 */
export async function handleNativeOAuthCallback(url: string): Promise<boolean> {
  if (!url.startsWith("com.hemix.ai://")) return false;

  try {
    const hashPart = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
    if (!hashPart) return false;

    const params = new URLSearchParams(hashPart);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) return false;

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;

    return true;
  } catch (e) {
    console.error("[google-auth] Failed to handle OAuth callback:", e);
    return false;
  }
}
