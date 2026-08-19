"use client";

import { useEffect } from "react";
import { useNativePlatform } from "./useNativePlatform";

/**
 * Initializes native app features when running inside Capacitor.
 * - Sets status bar style
 * - Hides splash screen
 * - Handles Android back button
 * - Sets safe area insets
 * - Configures keyboard behavior
 */
/**
 * Trigger haptic feedback on native platform (no-op on web).
 * Call from button presses for better mobile UX.
 */
export async function hapticFeedback(style: "light" | "medium" | "heavy" = "light") {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const styleMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: styleMap[style] });
    }
  } catch {}
}

export function useNativeInit() {
  const { isNative, platform } = useNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const initNative = async () => {
      try {
        // === STATUS BAR ===
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
        if (platform === "android") {
          await StatusBar.setOverlaysWebView({ overlay: false });
        }

        // === SPLASH SCREEN ===
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();

        // === KEYBOARD ===
        if (platform === "android") {
          const { Keyboard } = await import("@capacitor/keyboard");
          // Keyboard resize handled by Capacitor config
          Keyboard.setAccessoryBarVisible({ isVisible: false });
        }

        // === BACK BUTTON ===
        const { App } = await import("@capacitor/app");
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // Minimize app instead of exiting
            App.minimizeApp();
          }
        });

        // === OAUTH DEEP LINK (Google sign-in callback) ===
        // When the in-app browser finishes the Google consent flow, it
        // redirects to com.hemix.ai://auth/callback#access_token=...
        // Android hands that URL back to us here.
        App.addListener("appUrlOpen", async ({ url }) => {
          if (!url.startsWith("com.hemix.ai://auth/callback")) return;
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch {}
          const { handleNativeOAuthCallback } = await import("@/lib/google-auth");
          const ok = await handleNativeOAuthCallback(url);
          if (ok) {
            window.location.href = "/dashboard/chat";
          }
        });

        // === SAFE AREA ===
        // Add safe area class to body for CSS
        document.body.classList.add("native-app");
        if (platform === "android") {
          document.body.classList.add("native-android");
        }
      } catch (e) {
        // Capacitor plugins not available — web mode
        console.warn("[native-init] Capacitor plugins not available:", e);
      }
    };

    initNative();
  }, [isNative, platform]);
}
