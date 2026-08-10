"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Cpu, Sparkles, Zap, Bot } from "lucide-react";
import { AI_MODELS } from "@/lib/models";
import type { AIModel } from "@/types";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

const MODEL_ICONS: Record<string, typeof Cpu> = {
  "hemix-1": Bot,
  auto: Sparkles,
  "claude-opus-5": Cpu,
  "claude-opus-4-8": Zap,
  "gpt-5.6-sol": Cpu,
};

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const selected = AI_MODELS.find((m) => m.id === value) || AI_MODELS[0];
  const SelectedIcon = MODEL_ICONS[selected.id] || Cpu;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors"
      >
        <SelectedIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs sm:text-sm text-white font-medium">{selected.name}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 w-64 glass-strong rounded-xl p-2 shadow-2xl max-h-96 overflow-y-auto no-scrollbar border border-white/10"
          >
            {AI_MODELS.map((model) => {
              const Icon = MODEL_ICONS[model.id] || Cpu;
              const isSelected = model.id === value;

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(model.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
                    isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{model.name}</span>
                      {model.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{model.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
