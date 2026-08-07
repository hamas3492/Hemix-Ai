"use client";

import toast, { Toaster as HotToaster } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";

export const showSuccess = (msg: string) =>
  toast.success(msg, { icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> });

export const showError = (msg: string) =>
  toast.error(msg, { icon: <AlertCircle className="w-5 h-5 text-red-400" /> });

export const showInfo = (msg: string) =>
  toast(msg, { icon: <Info className="w-5 h-5 text-secondary" /> });

export const showWarning = (msg: string) =>
  toast(msg, { icon: <XCircle className="w-5 h-5 text-amber-400" /> });

export function ToastProvider() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(10, 10, 10, 0.9)",
          backdropFilter: "blur(20px)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      }}
    />
  );
}
