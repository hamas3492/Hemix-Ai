"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Cpu, Lock } from "lucide-react";
import { AI_MODELS } from "@/lib/models";
import type { AIModel } from "@/types";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  onSelectLockedModel?: (model: AIModel) => void;
}

export function ModelSelector({ value, onChange, onSelectLockedModel }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLockedModel, setSelectedLockedModel] = useState<AIModel | null>(null);

  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const { canUseModel, isFree } = useSubscription();

  const selected = AI_MODELS.find((m) => m.id === value) || AI_MODELS[3];

  const grouped = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const handleModelClick = (model: AIModel) => {
    const accessible = canUseModel(model.id);
    if (!accessible) {
      if (onSelectLockedModel) {
        onSelectLockedModel(model);
      } else {
        setSelectedLockedModel(model);
        setShowModal(true);
      }
      setOpen(false);
      return;
    }

    onChange(model.id);
    setOpen(false);
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors"
        >
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm text-white font-medium">{selected?.name || "Select model"}</span>
          {isFree && !canUseModel(selected?.id || "") && (
            <Lock className="w-3 h-3 text-amber-400" />
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-50 w-72 glass-strong rounded-xl p-2 shadow-2xl max-h-96 overflow-y-auto no-scrollbar border border-white/10"
            >
              {Object.entries(grouped).map(([provider, models]) => (
                <div key={provider} className="mb-2">
                  <p className="text-xs text-muted/60 uppercase tracking-wider px-2 py-1 capitalize font-mono">
                    {provider}
                  </p>
                  {models.map((model) => {
                    const isUnlocked = canUseModel(model.id);
                    const isSelected = model.id === value;

                    return (
                      <button
                        key={model.id}
                        onClick={() => handleModelClick(model)}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all relative group",
                          isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5",
                          !isUnlocked && "opacity-80 hover:opacity-100"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white">{model.name}</span>
                              {model.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                                  {model.badge}
                                </span>
                              )}
                            </div>

                            {!isUnlocked && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                PRO
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted mt-0.5 line-clamp-2">{model.description}</p>

                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {model.capabilities.slice(0, 3).map((cap) => (
                              <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted/80">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>

                        {isSelected && isUnlocked && (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedLockedModel(null);
        }}
        reason="model"
        targetModelName={selectedLockedModel?.name}
      />
    </>
  );
}
