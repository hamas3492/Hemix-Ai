"use client";

import { useEffect } from "react";
import { useChatStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useChatStore((s) => s.appSettings.theme);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(theme === "light" ? "light" : "dark");
  }, [theme]);

  return <>{children}</>;
}
