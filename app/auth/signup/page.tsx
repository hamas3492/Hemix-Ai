"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, Mail, Lock, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/components/ui/Toast";

export default function SignupPage() {
  const router = useRouter();
  const { signup, verifyOTP } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resend timer
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      // If session is returned, email auto-confirmed — skip OTP step
      if (result?.session) {
        showSuccess(`Welcome to Hemix AI, ${name.trim()}!`);
        router.push("/dashboard/chat");
        return;
      }
      showSuccess("Verification code sent to your email!");
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setErrorMsg(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const user = await verifyOTP(email.trim(), code);
      showSuccess(`Welcome to Hemix AI, ${user.name || "friend"}!`);
      router.push("/dashboard/chat");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid verification code.";
      setErrorMsg(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      await signup(name.trim(), email.trim(), password);
      showSuccess("A new verification code has been sent!");
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMsg(message);
      showError(message);
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
        {/* Top Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-5 h-5 rounded-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white">Hemix AI</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === 1 ? "Create account" : "Verify your email"}
          </h1>
          <p className="text-sm text-muted">
            {step === 1
              ? "Start your free trial — no credit card required"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Error Message Box */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleStep1Submit}
              className="space-y-4"
            >
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="pl-11"
                  required
                />
              </div>

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

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                <Input
                  type="password"
                  placeholder="Create password (min 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="pl-11"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-2 text-center">
                  Enter 6-digit verification code
                </label>
                <OtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onComplete={(val) => handleVerify(val)}
                  disabled={loading}
                  hasError={!!errorMsg}
                />
              </div>

              <Button
                type="button"
                onClick={() => handleVerify()}
                className="w-full"
                size="lg"
                loading={loading}
                disabled={otp.length !== 6 || loading}
              >
                Verify & Continue
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Resend Timer & Actions */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setErrorMsg(null);
                  }}
                  className="text-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to info
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-secondary hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend code
                  </button>
                ) : (
                  <span className="text-muted/80">
                    Resend code in <strong className="text-white font-mono">{resendTimer}s</strong>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 && (
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
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
