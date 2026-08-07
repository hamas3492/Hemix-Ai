"use client";

import { motion } from "framer-motion";
import { Sparkles, Send, Code2 } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-50" />

      <div className="relative glass-strong rounded-2xl overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 text-center text-xs text-muted">hemix.ai/dashboard</div>
        </div>

        {/* Content */}
        <div className="flex h-[420px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/5 p-3 hidden sm:block">
            <div className="flex items-center gap-2 px-2 py-2 mb-4">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Hemix AI</span>
            </div>

            <div className="px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-3">
              + New Chat
            </div>

            <div className="space-y-1">
              {["Getting started with...", "Code review help", "Marketing copy ideas"].map((title, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {title}
                </div>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              <div className="flex gap-2 justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl px-3 py-2 text-xs text-white max-w-[70%]">
                  Write a Python function to check if a number is prime
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                  H
                </div>
                <div className="glass rounded-2xl px-3 py-2 text-xs text-white max-w-[75%] font-mono">
                  <div className="flex items-center gap-1.5 mb-1 text-muted">
                    <Code2 className="w-3 h-3" />
                    <span>python</span>
                  </div>
                  <pre className="text-[11px] leading-relaxed text-green-300">{`def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5)+1):
        if n % i == 0:
            return False
    return True`}</pre>
                </div>
              </motion.div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-muted focus:outline-none"
                  readOnly
                />
                <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
