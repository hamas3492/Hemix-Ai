"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Crown, Lock, Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UpgradeReason } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: UpgradeReason;
  targetModelName?: string;
}

const PRO_FEATURES = [
  "Unlimited daily messages",
  "Access to all 4 AI models (GPT-5.0, Claude 5 Sonnet, Claude 4.8)",
  "Sub-second priority response speed",
  "File & image analysis capabilities",
  "Up to 256,000 token context window",
  "Priority support & API access",
];

export function UpgradeModal({
  open,
  onClose,
  reason = "general",
  targetModelName,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/billing");
  };

  const title =
    reason === "limit"
      ? "Daily Message Limit Reached"
      : reason === "model"
      ? `Unlock ${targetModelName || "Pro Models"}`
      : "Upgrade to Hemix AI Pro";

  const description =
    reason === "limit"
      ? "You've used all 10 free daily messages. Upgrade to Pro for unlimited messages and unrestricted model access."
      : reason === "model"
      ? `${targetModelName || "This model"} is exclusively available on the Pro plan. Upgrade now to unlock flagship AI intelligence.`
      : "Supercharge your workflow with unlimited AI messages, flagship models, and high-speed processing.";

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg bg-[#050505]/90 border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-2xl">
      {/* Header gradient banner */}
      <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              {reason === "model" ? (
                <Lock className="w-5 h-5 text-primary" />
              ) : reason === "limit" ? (
                <Zap className="w-5 h-5 text-secondary" />
              ) : (
                <Crown className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <Badge variant="primary" className="bg-primary/20 text-primary-300 border-primary/30 font-semibold px-2.5 py-1">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-3 h-3 rounded-full object-cover animate-pulse" />
              PRO TIER
            </Badge>
          </div>
          <span className="text-2xl font-extrabold text-white">
            $20<span className="text-sm font-normal text-muted">/mo</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-muted/90 leading-relaxed">{description}</p>
      </div>

      {/* Body content */}
      <div className="p-6 space-y-6">
        {/* Features list */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Everything in Pro includes:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs text-slate-200"
              >
                <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Highlight box */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
          <div className="text-xs text-muted">
            <span className="text-white font-medium">Risk-free.</span> Cancel anytime from your billing settings. Instant access upon upgrade.
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} className="text-muted hover:text-white">
            Maybe Later
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-primary via-primary-600 to-secondary text-white font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
