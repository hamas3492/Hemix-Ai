"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = "primary", size = "md", loading = false, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/20",
      secondary: "bg-secondary text-white hover:bg-secondary-600 shadow-lg shadow-secondary/20",
      ghost: "text-muted hover:text-white hover:bg-white/5",
      outline: "border border-white/10 text-white hover:bg-white/5 hover:border-white/20",
      destructive: "bg-red-500 text-white hover:bg-red-600",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "h-9 px-3 text-sm gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-14 px-8 text-base gap-2.5",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
