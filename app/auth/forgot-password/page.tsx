"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowRight, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      showSuccess("Password reset instructions sent to your email!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setErrorMsg(msg);
      showError(msg);
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
      <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Hemix AI</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">
            {sent ? "Check your email" : "Reset password"}
          </h1>
          <p className="text-sm text-muted">
            {sent
              ? `We've sent reset instructions to ${email}`
              : "Enter your email address and we'll send you instructions to reset your password"}
          </p>
        </div>

        {errorMsg && !sent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xs text-muted leading-relaxed">
              If an account exists for <strong className="text-white">{email}</strong>, you will receive an email shortly with a password reset link.
            </p>
            <div className="pt-2">
              <a
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-400 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="pl-11"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send Instructions
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-sm text-muted">
            Remembered your password?{" "}
            <a
              href="/auth/login"
              className="text-primary hover:text-primary-400 font-medium transition-colors"
            >
              Sign in
            </a>
          </p>
        )}
      </div>
    </motion.div>
  );
}
