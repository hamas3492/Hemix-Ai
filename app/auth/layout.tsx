"use client";

import { Providers } from "@/components/Providers";
import { AuroraBackground } from "@/components/landing/AuroraBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuroraBackground />
      <div className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 safe-top safe-bottom">
        {children}
      </div>
    </Providers>
  );
}
