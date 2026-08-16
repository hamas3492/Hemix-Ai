"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

/**
 * Shows a banner when the network is offline.
 * No-op when online. Works in both web and Capacitor.
 */
export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-white"
          style={{ background: "#dc2626", paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Unable to connect to Hemix. Check your connection.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
