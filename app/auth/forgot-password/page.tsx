"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowRight, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth-service";
import { showError, showSuccess } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      authService.requestPasswordReset(email);
      setSent(true);
      showSuccess("Password reset link sent to your email");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Hemix AI</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">
            {sent ? "Check your email" : "Reset password"}
          </h1>
          <p className="text-sm text-muted">
            {sent
              ? `We've sent a reset link to ${email}`
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <a href="/auth/login" className="text-sm text-primary hover:text-primary-400 font-medium transition-colors">
              Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-sm text-muted">
            Remembered your password?{" "}
            <a href="/auth/login" className="text-primary hover:text-primary-400 font-medium transition-colors">
              Sign in
            </a>
          </p>
        )}
      </div>
    </motion.div>
  );
}
