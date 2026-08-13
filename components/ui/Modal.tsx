"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  mobileSheet?: boolean;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    setIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return isMobile;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  mobileSheet = false,
}: ModalProps) {
  const isMobile = useIsMobile();
  const isSheet = mobileSheet && isMobile;

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex justify-center",
            isSheet ? "items-end p-0" : "items-center p-4"
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={
              isSheet
                ? { y: "100%", opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            animate={
              isSheet
                ? { y: 0, opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              isSheet
                ? { y: "100%", opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            style={
              isSheet
                ? {
                    paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
                  }
                : undefined
            }
            className={cn(
              isSheet
                ? "fixed bottom-0 left-0 right-0 w-full max-h-[85vh] overflow-y-auto glass-strong rounded-t-2xl rounded-b-none p-6 shadow-2xl z-10"
                : "relative w-full max-w-md glass-strong rounded-2xl p-6 shadow-2xl",
              className
            )}
          >
            {isSheet && (
              <div className="flex justify-center -mt-2 mb-3" aria-hidden="true">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {title && (
              <h2 className="text-xl font-semibold text-white mb-1">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted mb-4">{description}</p>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
