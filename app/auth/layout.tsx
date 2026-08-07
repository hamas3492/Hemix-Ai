"use client";

import { Providers } from "@/components/Providers";
import { AuroraBackground } from "@/components/landing/AuroraBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuroraBackground />
      <div className="min-h-screen flex items-center justify-center px-4">
        {children}
      </div>
    </Providers>
  );
}
