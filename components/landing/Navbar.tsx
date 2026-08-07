"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong py-3" : "py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold text-white">Hemix AI</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/auth/login")}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = "/auth/signup")}>
            Get Started
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden mt-4 glass-strong rounded-xl mx-4 p-4 space-y-3"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-muted hover:text-white transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => (window.location.href = "/auth/login")}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={() => (window.location.href = "/auth/signup")}>
              Get Started
            </Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
