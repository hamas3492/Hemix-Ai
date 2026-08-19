"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/hooks/useNativePlatform";
import { authService } from "@/services/auth-service";

/**
 * Gates the marketing landing page.
 *
 * - Web visitors (browser) see the full landing page as normal.
 * - Inside the native Android/iOS app, the landing page is skipped entirely —
 *   users go straight to login/signup (or straight into the app if already
 *   signed in). A logged-out mobile app has no reason to show marketing copy.
 */
export function NativeAppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!isNativeApp()) {
        if (mounted) {
          setShowLanding(true);
          setChecking(false);
        }
        return;
      }

      try {
        const user = await authService.getSession();
        if (!mounted) return;
        router.replace(user ? "/dashboard/chat" : "/auth/login");
      } catch {
        if (mounted) router.replace("/auth/login");
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <img src="/assets/icon.png" alt="Hemix AI" className="w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  if (!showLanding) return null; // redirecting inside the native app

  return <>{children}</>;
}
