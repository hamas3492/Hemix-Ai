"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Cpu } from "lucide-react";
import { AI_MODELS } from "@/lib/models";
import type { AIModel } from "@/types";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const selected = AI_MODELS.find((m) => m.id === value);

  const grouped = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm text-white">{selected?.name || "Select model"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 w-72 glass-strong rounded-xl p-2 shadow-2xl max-h-96 overflow-y-auto no-scrollbar"
          >
            {Object.entries(grouped).map(([provider, models]) => (
              <div key={provider} className="mb-2">
                <p className="text-xs text-muted/60 uppercase tracking-wider px-2 py-1 capitalize">{provider}</p>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors",
                      model.id === value ? "bg-primary/10" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{model.name}</span>
                        {model.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{model.description}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {model.capabilities.slice(0, 3).map((cap) => (
                          <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {model.id === value && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
