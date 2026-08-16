"use client";

import { useNativeInit } from "@/hooks/useNativeInit";

/**
 * Initializes native Capacitor features (status bar, splash, back button, keyboard).
 * No-op when running in a regular browser — only activates inside the Android app.
 */
export function NativeInit() {
  useNativeInit();
  return null;
}
