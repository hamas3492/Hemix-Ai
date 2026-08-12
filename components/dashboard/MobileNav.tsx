"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Mic, Image as ImageIcon, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activePath: string;
  onVoicePress?: () => void;
  onImagePress?: () => void;
}

const NAV_ITEMS = [
  { id: "chat", label: "Chat", href: "/dashboard/chat", icon: MessageSquare, type: "link" as const },
  { id: "voice", label: "Voice", href: null, icon: Mic, type: "action" as const },
  { id: "images", label: "Images", href: null, icon: ImageIcon, type: "action" as const },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings, type: "link" as const },
];

export function MobileNav({ activePath, onVoicePress, onImagePress }: MobileNavProps) {
  const pathname = usePathname();

  const handleClick = (item: typeof NAV_ITEMS[0]) => {
    if (item.id === "voice" && onVoicePress) onVoicePress();
    else if (item.id === "images" && onImagePress) onImagePress();
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t"
      style={{ borderColor: "var(--glass-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-[56px]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.type === "link" && (pathname === item.href || pathname.startsWith(item.href + "/"));

          if (item.type === "link") {
            return (
              <Link key={item.id} href={item.href!}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target no-select transition-colors",
                  isActive ? "text-primary" : "text-muted"
                )}
                style={{ color: isActive ? "var(--primary, #3b82f6)" : "var(--fg-muted)" }}>
                {isActive && (
                  <motion.div layoutId="mobileNavIndicator"
                    className="absolute top-0 w-8 h-0.5 rounded-full"
                    style={{ background: "var(--primary, #3b82f6)" }} />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          }

          return (
            <button key={item.id}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target no-select transition-colors"
              style={{ color: "var(--fg-muted)" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
