"use client";

import { motion } from "framer-motion";
import {
  PenTool,
  Code2,
  Calculator,
  Languages,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { AI_CAPABILITIES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  PenTool,
  Code2,
  Calculator,
  Languages,
  Sparkles,
  GraduationCap,
};

export function AICapabilities() {
  return (
    <section id="capabilities" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            One platform.
            <span className="gradient-text"> Infinite possibilities.</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            From writing to coding, analysis to translation — Hemix AI handles it all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_CAPABILITIES.map((cap, i) => {
            const Icon = iconMap[cap.icon];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">{cap.title}</h3>
                    <p className="text-sm text-muted mb-3 leading-relaxed">{cap.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cap.examples.map((ex, j) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-muted border border-white/5"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
