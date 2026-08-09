"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Crown, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UsageBannerProps {
  messagesUsedToday: number;
  dailyLimit?: number;
  messagesRemaining: number;
  onUpgradeClick?: () => void;
  className?: string;
}

export function UsageBanner({
  messagesUsedToday,
  dailyLimit = 10,
  messagesRemaining,
  onUpgradeClick,
  className,
}: UsageBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const percentage = Math.min(100, Math.round((messagesUsedToday / dailyLimit) * 100));
  const isLimitReached = messagesRemaining <= 0;
  const isWarning = messagesRemaining === 1 || messagesRemaining === 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "w-full px-4 py-2.5 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs transition-colors shadow-md",
          isLimitReached
            ? "bg-red-950/40 border-red-500/30 text-red-200"
            : isWarning
            ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
            : "bg-white/[0.03] border-white/10 text-white",
          className
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 font-medium">
            {isLimitReached ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            ) : isWarning ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-primary shrink-0" />
            )}

            <span>
              {isLimitReached ? (
                <span className="font-semibold text-red-300">Daily limit reached — 10 of 10 messages used today.</span>
              ) : isWarning ? (
                <span className="font-semibold text-amber-300">
                  Almost at limit — only {messagesRemaining} {messagesRemaining === 1 ? "message" : "messages"} left today ({messagesUsedToday}/{dailyLimit} used)
                </span>
              ) : (
                <span>
                  <strong className="text-white">{messagesUsedToday}</strong> of <strong>{dailyLimit}</strong> free daily messages used today
                </span>
              )}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-[140px] h-2 rounded-full bg-white/10 overflow-hidden shrink-0 hidden sm:block">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-colors",
                isLimitReached
                  ? "bg-red-500"
                  : isWarning
                  ? "bg-amber-400"
                  : "bg-gradient-to-r from-primary to-secondary"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onUpgradeClick ? (
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary-300 font-semibold text-xs transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrade to Pro</span>
            </button>
          ) : (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary-300 font-semibold text-xs transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrade to Pro</span>
            </Link>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-muted hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
