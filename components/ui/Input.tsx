"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted mb-2">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted/50 transition-all duration-200 focus:outline-none focus:border-primary/50 focus:bg-white/8",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
