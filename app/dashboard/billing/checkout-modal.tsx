"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  ArrowRight,
  Clock,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Loader2,
  DollarSign,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { PricingPlan } from "@/types";
import { paymentService, PaymentInstructions, SubscriptionRecord } from "@/services/payment-service";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { showSuccess, showError } from "@/components/ui/Toast";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  userId: string;
  onSubscriptionCreated?: (sub: SubscriptionRecord) => void;
}

export function CheckoutModal({
  open,
  onClose,
  plan,
  userId,
  onSubscriptionCreated,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [createdSub, setCreatedSub] = useState<SubscriptionRecord | null>(null);

  // Reset modal state when opened
  useEffect(() => {
    if (open && plan) {
      setStep(1);
      setLoading(false);
      setTransactionId("");
      setCopiedEmail(false);
      setCopiedRef(false);
      
      // Pre-generate payment instructions for selected plan
      const inst = paymentService.getPaymentInstructions(plan.id);
      setInstructions(inst);
      setReferenceCode(inst.reference);
    }
  }, [open, plan]);

  if (!plan) return null;

  const handleStartCheckout = async () => {
    setLoading(true);
    try {
      // Call API route /api/checkout or fallback to paymentService
      let result;
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.id, userId }),
        });
        if (res.ok) {
          result = await res.json();
        }
      } catch {
        // Fallback to client service if offline or local
      }

      if (!result || !result.success) {
        result = paymentService.createSubscription(userId, plan.id as "pro" | "enterprise", referenceCode);
      }

      if (result.instructions) setInstructions(result.instructions);
      if (result.reference) setReferenceCode(result.reference);
      if (result.subscription) {
        setCreatedSub(result.subscription);
        if (onSubscriptionCreated) onSubscriptionCreated(result.subscription);
      }

      setStep(2);
    } catch (err: any) {
      showError(err.message || "Failed to initialize payment instructions");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "email" | "ref") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
    showSuccess(`Copied ${type === "email" ? "Payoneer Email" : "Reference Code"} to clipboard!`);
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) {
      showError("Please enter a valid Payoneer Transaction ID.");
      return;
    }

    setLoading(true);
    try {
      // Update transaction ID on payment service
      const updated = paymentService.submitTransactionId(referenceCode, transactionId.trim());

      // Attempt verification via API route /api/verify-payment
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: referenceCode, transactionId: transactionId.trim() }),
        });
        const data = await res.json();
        if (data.success && data.subscription) {
          setCreatedSub(data.subscription);
          if (onSubscriptionCreated) onSubscriptionCreated(data.subscription);
        } else if (updated) {
          setCreatedSub(updated);
          if (onSubscriptionCreated) onSubscriptionCreated(updated);
        }
      } catch {
        if (updated) {
          setCreatedSub(updated);
          if (onSubscriptionCreated) onSubscriptionCreated(updated);
        }
      }

      showSuccess("Transaction ID submitted! Your payment is now under review.");
      setStep(4);
    } catch (err: any) {
      showError(err.message || "Failed to submit transaction ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-xl border border-white/10 bg-[#0A0A0C]/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden rounded-3xl"
    >
      {/* Modal Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                Upgrade to {plan.name}
              </h2>
              <p className="text-xs text-muted">Payoneer Payment Integration</p>
            </div>
          </div>
          <Badge variant="primary" className="text-xs py-1 px-3">
            ${plan.price} / {plan.period}
          </Badge>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-1 mt-4">
          {[
            { num: 1, label: "Plan Summary" },
            { num: 2, label: "Payoneer Details" },
            { num: 3, label: "Enter TXN ID" },
            { num: 4, label: "Under Review" },
          ].map((s) => (
            <div key={s.num} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full h-1 rounded-full mb-1 transition-all duration-300 ${
                  step >= s.num
                    ? "bg-gradient-to-r from-primary to-secondary"
                    : "bg-white/10"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  step >= s.num ? "text-white" : "text-muted"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Plan Summary */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name} Plan</h3>
                    <p className="text-xs text-muted mt-0.5">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-xs text-muted"> / {plan.period}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 my-3 pt-3">
                  <p className="text-xs font-semibold text-white/80 mb-2">Features Included:</p>
                  <ul className="grid grid-cols-1 gap-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <p>
                  Payoneer payments are processed manually. Once you send the money and submit your Transaction ID, our team verifies it promptly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" loading={loading} onClick={handleStartCheckout}>
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Payoneer Instructions */}
          {step === 2 && instructions && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-xs text-muted">
                Please transfer the exact amount using Payoneer to our receiving account:
              </p>

              {/* Payoneer Email Box */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                    Payoneer Receiving Email
                  </p>
                  <p className="text-sm font-semibold text-secondary font-mono mt-0.5">
                    {instructions.payoneerEmail}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(instructions.payoneerEmail, "email")}
                  className="h-8 text-xs"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEmail ? "Copied" : "Copy"}
                </Button>
              </div>

              {/* Amount & Reference Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                    Amount Due
                  </p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    ${instructions.amount} USD
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-primary/30 bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                      Payment Reference
                    </p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {referenceCode}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(referenceCode, "ref")}
                    className="h-8 w-8 text-xs"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Instructions List */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-2">
                <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Step-by-step Instructions:
                </p>
                <ol className="space-y-1.5 text-xs text-muted list-decimal list-inside">
                  <li>Open Payoneer and choose &quot;Make a Payment&quot;.</li>
                  <li>Enter receiving email: <span className="text-secondary font-mono">{instructions.payoneerEmail}</span></li>
                  <li>Enter exact amount: <span className="text-white font-semibold">${instructions.amount} USD</span></li>
                  <li>Include reference in Payment Notes: <span className="text-primary font-mono font-bold">{referenceCode}</span></li>
                  <li>Complete payment and copy your Payoneer Transaction ID.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  I Have Paid — Enter TXN ID
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Enter Transaction ID */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <p className="text-xs text-muted mb-1">Your Payment Reference</p>
                <p className="text-base font-bold text-primary font-mono">{referenceCode}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Payoneer Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104958223 or TXN-892348"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <p className="text-[11px] text-muted mt-1">
                  You can find this ID in your Payoneer transaction history or receipt email.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Instructions
                </Button>
                <Button
                  variant="primary"
                  loading={loading}
                  onClick={handleSubmitTransaction}
                >
                  Submit for Verification
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Under Review Confirmation */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto text-primary">
                <Clock className="w-8 h-8 animate-pulse text-primary" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Payment Under Review
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  Thank you! Your payment submission has been received. Our automated and manual verification systems are processing your Payoneer payment.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Plan:</span>
                  <span className="text-white font-semibold">{plan.name} (${plan.price}/mo)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Reference Code:</span>
                  <span className="text-primary font-bold">{referenceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Transaction ID:</span>
                  <span className="text-secondary font-bold">{transactionId || "Submitted"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Verification
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" className="w-full" onClick={onClose}>
                  Done & Return to Billing
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
