"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardPreview } from "./DashboardPreview";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center max-w-4xl mx-auto"
      >
        <Badge variant="primary" className="mb-6 animate-pulse-glow">
          <Sparkles className="w-3 h-3" />
          Powered by 4 Premium Models
        </Badge>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight text-balance">
          Think Faster.
          <br />
          <span className="gradient-text">Create Smarter.</span>
        </h1>

        <p className="mt-6 text-lg text-muted max-w-2xl text-balance">
          The premium AI platform that brings GPT-5.0, Claude 5, Claude 4.8, and more into one
          beautiful, unified experience. Stream responses, write code, analyze files — all in real-time.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/auth/signup")}
            className="group"
          >
            Start Chatting Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Explore Features
          </Button>
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            No credit card required
          </span>
          <span className="hidden sm:block">·</span>
          <span className="hidden sm:flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            50 free messages / day
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-16 w-full max-w-5xl"
      >
        <DashboardPreview />
      </motion.div>
    </section>
  );
}
