"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Download, Share2, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { showSuccess } from "@/components/ui/Toast";

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt = "Image", onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastTap = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 1, 4));
      if (e.key === "-") setZoom(z => Math.max(z - 1, 1));
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleClose = () => { resetView(); onClose(); };

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `hemix-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Hemix AI Image", text: alt, url: src }); }
      catch {}
    } else {
      copyToClipboard(src);
      showSuccess("Image URL copied");
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoom(z => (z === 1 ? 2 : z === 2 ? 3 : 1));
      if (zoom !== 1) setPan({ x: 0, y: 0 });
    }
    lastTap.current = now;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) setZoom(z => Math.min(z + 0.5, 4));
    else setZoom(z => Math.max(z - 0.5, 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const pinchStart = useRef({ dist: 0, zoom: 1 });

  const getPinchDist = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start — record initial distance and zoom
      pinchStart.current = {
        dist: getPinchDist(e.touches[0], e.touches[1]),
        zoom: zoom,
      };
      setDragging(false);
    } else if (e.touches.length === 1) {
      handleDoubleTap();
      if (zoom > 1) {
        setDragging(true);
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current.dist > 0) {
      // Pinch zoom
      const newDist = getPinchDist(e.touches[0], e.touches[1]);
      const scale = newDist / pinchStart.current.dist;
      const newZoom = Math.max(1, Math.min(4, pinchStart.current.zoom * scale));
      setZoom(newZoom);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragging && zoom > 1) {
      setPan({
        x: dragStart.current.panX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.touches[0].clientY - dragStart.current.y),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchStart.current.dist = 0;
    if (e.touches.length === 0) setDragging(false);
  };

  const toolBtn = "p-2.5 rounded-xl glass-strong hover:bg-white/10 transition-colors touch-target no-select";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.95)" }}
      >
        {/* Close button */}
        <button onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-xl glass-strong hover:bg-white/10 transition-colors touch-target no-select safe-top"
          style={{ color: "#fff" }} aria-label="Close viewer">
          <X className="w-6 h-6" />
        </button>

        {/* Zoom controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 safe-top">
          <button onClick={() => setZoom(z => Math.min(z + 1, 4))} className={toolBtn} style={{ color: "#fff" }} aria-label="Zoom in">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => { setZoom(z => Math.max(z - 1, 1)); if (zoom === 2) setPan({ x: 0, y: 0 }); }} className={toolBtn} style={{ color: "#fff" }} aria-label="Zoom out">
            <ZoomOut className="w-5 h-5" />
          </button>
          {zoom !== 1 && (
            <button onClick={resetView} className={toolBtn} style={{ color: "#fff" }} aria-label="Reset zoom">
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 safe-bottom">
          <button onClick={handleDownload} className={toolBtn} style={{ color: "#fff" }} aria-label="Download">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={handleShare} className={toolBtn} style={{ color: "#fff" }} aria-label="Share">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab"
          style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
        >
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: "#3b82f6", borderBottomColor: "#3b82f6" }} />
            </div>
          )}
          {error && (
            <div className="text-center">
              <p className="text-white/60 text-sm">Failed to load image</p>
              <button onClick={() => { setError(false); setLoading(true); }} className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-sm">Retry</button>
            </div>
          )}
          <motion.img
            src={src}
            alt={alt}
            className="max-w-full max-h-full select-none"
            style={{ objectFit: "contain" }}
            animate={{
              scale: zoom,
              x: pan.x,
              y: pan.y,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            draggable={false}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
