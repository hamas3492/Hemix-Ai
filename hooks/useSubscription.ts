"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useChatStore } from "@/lib/store";

export type UpgradeReason = "limit" | "model" | "general";

const FREE_DAILY_LIMIT = 10;

function getTodayKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useSubscription() {
  const authContext = useAuth();
  const storeUser = useChatStore((s) => s.user);

  const user = authContext?.user || storeUser;
  const plan = user?.plan || "free";

  const isFree = plan === "free";
  const isPro = plan === "pro";
  const isEnterprise = plan === "enterprise";

  const [messagesUsedToday, setMessagesUsedToday] = useState<number>(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>("general");
  const [targetModel, setTargetModel] = useState<string | undefined>(undefined);

  // Initialize and check daily message count with date reset logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `hemix_daily_msg_${user?.id || "guest"}`;
    const today = getTodayKey();

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today && typeof parsed.count === "number") {
          setMessagesUsedToday(parsed.count);
          return;
        }
      }
      // New day or no record
      localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
      setMessagesUsedToday(0);
    } catch {
      setMessagesUsedToday(0);
    }
  }, [user?.id]);

  const incrementMessageCount = useCallback(() => {
    if (plan !== "free") return;

    setMessagesUsedToday((prev) => {
      const newCount = prev + 1;
      if (typeof window !== "undefined") {
        const storageKey = `hemix_daily_msg_${user?.id || "guest"}`;
        const today = getTodayKey();
        localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
      }
      return newCount;
    });
  }, [plan, user?.id]);

  const canUseModel = useCallback(
    (modelId: string) => {
      if (plan === "pro" || plan === "enterprise") return true;
      return modelId === "agentrouter/auto";
    },
    [plan]
  );

  const canSendMessage = plan !== "free" || messagesUsedToday < FREE_DAILY_LIMIT;
  const messagesRemaining = plan === "free" ? Math.max(0, FREE_DAILY_LIMIT - messagesUsedToday) : Infinity;

  const openUpgradeModal = useCallback((reason: UpgradeReason = "general", modelId?: string) => {
    setUpgradeReason(reason);
    setTargetModel(modelId);
    setShowUpgradePrompt(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradePrompt(false);
    setTargetModel(undefined);
  }, []);

  return {
    plan,
    isFree,
    isPro,
    isEnterprise,
    dailyLimit: FREE_DAILY_LIMIT,
    messagesUsedToday,
    messagesRemaining,
    canSendMessage,
    canUseModel,
    incrementMessageCount,
    showUpgradePrompt,
    setShowUpgradePrompt,
    upgradeReason,
    targetModel,
    openUpgradeModal,
    closeUpgradeModal,
  };
}
