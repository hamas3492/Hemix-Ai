"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activePath: string;
  onVoicePress?: () => void;
  onImagePress?: () => void;
}

export function MobileNav({ activePath }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = pathname === "/dashboard/chat" || pathname.startsWith("/dashboard/chat/");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t"
      style={{ borderColor: "var(--glass-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-center h-[48px]">
        <Link href="/dashboard/chat"
          className={cn(
            "flex items-center justify-center h-full px-8 touch-target no-select transition-colors",
          )}
          style={{ color: isActive ? "var(--primary, #3b82f6)" : "var(--fg-muted)" }}>
          {isActive && (
            <motion.div layoutId="mobileNavIndicator"
              className="absolute top-0 w-8 h-0.5 rounded-full"
              style={{ background: "var(--primary, #3b82f6)" }} />
          )}
          <MessageSquare className="w-5 h-5" />
        </Link>
      </div>
    </nav>
  );
}
