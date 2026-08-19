"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useChatStore } from "@/lib/store";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header — padded for the status bar / notch so content never overlaps it */}
        <header className="lg:hidden flex items-center gap-3 px-4 glass border-b shrink-0 z-30"
          style={{
            borderColor: "var(--glass-border)",
            paddingTop: "calc(0.625rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "0.625rem",
          }}>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors touch-target"
            aria-label="Open menu">
            <Menu className="w-5 h-5" style={{ color: 'var(--fg)' }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden">
              <img src="/assets/icon.png" alt="Hemix" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Hemix AI</span>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden min-w-0 ">
          {children}
        </main>

        {/* Mobile bottom navigation */}
      </div>
    </div>
  );
}
