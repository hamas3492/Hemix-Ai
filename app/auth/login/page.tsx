"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/components/ui/Toast";

type LoginMode = "password" | "email-otp" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithOTP, verifyLoginOTP, loginWithPhoneOTP, verifyPhoneOTP } = useAuth();

  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [otp, setOtp] = useState("");

  // Phone state
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resend timer for OTP mode step 2
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === 2 && resendTimer > 0) {
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
  }, [otpStep, resendTimer]);

  // Reset OTP step when switching modes
  useEffect(() => {
    setOtpStep(1);
    setOtp("");
  }, [mode]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password, remember);
      showSuccess(`Welcome back, ${user.name || "friend"}!`);
      router.push("/dashboard/chat");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await loginWithOTP(email.trim());
      showSuccess("Verification code sent to your email!");
      setOtpStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const user = await verifyLoginOTP(email.trim(), code);
      showSuccess(`Welcome back, ${user.name || "friend"}!`);
      router.push("/dashboard/chat");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // === Phone OTP handlers ===
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim()) {
      setErrorMsg("Please enter your phone number.");
      return;
    }

    // Normalize: ensure it starts with +
    const normalizedPhone = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim()}`;

    setLoading(true);
    try {
      await loginWithPhoneOTP(normalizedPhone);
      showSuccess("Verification code sent to your phone!");
      setOtpStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    const normalizedPhone = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim()}`;

    setErrorMsg(null);
    setLoading(true);

    try {
      const user = await verifyPhoneOTP(normalizedPhone, code);
      showSuccess(`Welcome back, ${user.name || "friend"}!`);
      router.push("/dashboard/chat");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = mode === "phone" ? handleVerifyPhoneOtp : handleVerifyLoginOtp;
  const handleSendOtp = mode === "phone" ? handleSendPhoneOtp : handleSendLoginOtp;
  const targetLabel = mode === "phone" ? phone : email;
  const targetLabelType = mode === "phone" ? "phone number" : "email";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-5 h-5 rounded-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white">Hemix AI</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to your account to continue</p>
        </div>

        {/* Google Sign-In */}
        <div className="mb-5">
          <GoogleAuthButton label="Continue with Google" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-muted font-medium">or sign in with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "password"
                ? "bg-primary text-white shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("email-otp");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "email-otp"
                ? "bg-primary text-white shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "phone"
                ? "bg-primary text-white shadow-md"
                : "text-muted hover:text-white"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Phone
          </button>
        </div>

        {/* Inline Error Message */}
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
          {mode === "password" ? (
            <motion.form
              key="password-mode"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-4"
            >
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="pl-11"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                  />
                  <span className="text-sm text-muted">Remember me</span>
                </label>
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-secondary hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : otpStep === 1 ? (
            <motion.form
              key={`${mode}-step1`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              {mode === "phone" ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                  <Input
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="pl-11"
                    required
                  />
                </div>
              ) : (
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
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send One-Time Code
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key={`${mode}-step2`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-2 text-center">
                  Enter 6-digit code sent to <span className="text-white">{targetLabel}</span>
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
                Verify & Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(1);
                    setOtp("");
                    setErrorMsg(null);
                  }}
                  className="text-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change {targetLabelType}
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-secondary hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend code
                  </button>
                ) : (
                  <span className="text-muted/80">
                    Resend in <strong className="text-white font-mono">{resendTimer}s</strong>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/signup"
            className="text-primary hover:text-primary-400 font-medium transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </motion.div>
  );
}
