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
