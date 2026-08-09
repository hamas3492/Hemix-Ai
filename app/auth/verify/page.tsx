"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/components/ui/Toast";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, verifyLoginOTP, loginWithOTP } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const typeParam = searchParams.get("type") || "signup"; // 'signup' | 'login'

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
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
  }, [resendTimer]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!email) {
      setErrorMsg("Email address is missing. Please return to sign in.");
      return;
    }
    if (code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      if (typeParam === "login") {
        await verifyLoginOTP(email, code);
      } else {
        await verifyOTP(email, code);
      }
      showSuccess("Verification successful!");
      router.push("/dashboard/chat");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email || loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      await loginWithOTP(email);
      showSuccess("Verification code resent to your email!");
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
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
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-5 h-5 rounded-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white">Hemix AI</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">Verify Code</h1>
          <p className="text-sm text-muted">
            {email ? (
              <>We sent a 6-digit code to <strong className="text-white">{email}</strong></>
            ) : (
              "Enter your 6-digit verification code"
            )}
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <div className="space-y-6">
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

          <div className="flex items-center justify-between pt-2 text-xs">
            <a
              href="/auth/login"
              className="text-muted hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </a>

            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
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
        </div>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md glass-strong rounded-2xl p-8 text-center text-muted">
          Loading verification page...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
