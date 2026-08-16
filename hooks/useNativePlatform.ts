"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the app is running inside a Capacitor native container (Android/iOS).
 * Uses the official Capacitor platform detection.
 */
export function useNativePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<"web" | "android" | "ios">("web");

  useEffect(() => {
    const check = async () => {
      try {
        const cap = (window as any).Capacitor;
        if (cap && cap.isNativePlatform) {
          const native = cap.isNativePlatform();
          setIsNative(native);
          if (native && cap.getPlatform) {
            const p = cap.getPlatform();
            setPlatform(p === "ios" ? "ios" : "android");
          }
        }
      } catch {
        // Not in Capacitor — web only
      }
    };
    check();
  }, []);

  return { isNative, platform };
}

/**
 * Simple check — returns true if running in Capacitor native container.
 */
export function isNativeApp(): boolean {
  try {
    const cap = (window as any).Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  } catch {
    return false;
  }
}
