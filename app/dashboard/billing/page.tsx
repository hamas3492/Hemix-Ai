"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  Download,
  Clock,
  ShieldCheck,
  XCircle,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useChatStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PRICING_PLANS } from "@/lib/constants";
import { getMessageLimit } from "@/lib/subscription";
import { paymentService, SubscriptionRecord } from "@/services/payment-service";
import { CheckoutModal } from "./checkout-modal";
import { showSuccess, showError } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const { user, updateProfile } = useAuth();
  const {
    conversations,
    dailyMessageCount,
    subscription,
    setSubscription,
  } = useChatStore();

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [history, setHistory] = useState<SubscriptionRecord[]>([]);
  const [loadingCancel, setLoadingLoadingCancel] = useState(false);

  // Admin verification testing state
  const [adminRef, setAdminRef] = useState("");
  const [adminTxnId, setAdminTxnId] = useState("");
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);

  const userId = user?.id || "guest_user";

  const refreshSubscriptionData = useCallback(() => {
    const currentSub = paymentService.getSubscription(userId);
    setSubscription(currentSub);
    const userSubs = paymentService.getUserSubscriptions(userId);
    setHistory(userSubs);
  }, [userId, setSubscription]);

  useEffect(() => {
    refreshSubscriptionData();
  }, [refreshSubscriptionData]);

  const activeSub = subscription || paymentService.getSubscription(userId);
  const effectivePlanId = activeSub?.status === "active" ? activeSub.plan : user?.plan || "free";
  const currentPlan = PRICING_PLANS.find((p) => p.id === effectivePlanId) || PRICING_PLANS[0];

  const totalConversations = conversations.length;
  const messageLimit = getMessageLimit(effectivePlanId);
  const isUnlimited = messageLimit === Infinity;

  const handleOpenCheckout = (plan: any) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutModalOpen(true);
  };

  const handleSubscriptionCreated = (sub: SubscriptionRecord) => {
    setSubscription(sub);
    refreshSubscriptionData();
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium models at the end of your billing cycle.")) {
      return;
    }
    setLoadingLoadingCancel(true);
    try {
      const cancelled = paymentService.cancelSubscription(userId);
      if (cancelled) {
        setSubscription(cancelled);
        refreshSubscriptionData();
        showSuccess("Subscription cancelled successfully.");
      }
    } catch {
      showError("Failed to cancel subscription.");
    } finally {
      setLoadingLoadingCancel(false);
    }
  };

  const handleAdminVerify = async () => {
    if (!adminRef.trim()) {
      showError("Please enter a Payment Reference code to verify.");
      return;
    }
    setVerifyingAdmin(true);
    try {
      const verified = paymentService.verifyPayment(adminRef.trim(), adminTxnId.trim() || undefined);
      if (verified) {
        setSubscription(verified);
        if (updateProfile) {
          updateProfile({} as any);
        }
        refreshSubscriptionData();
        showSuccess(`Subscription ${verified.reference} marked as ACTIVE (${verified.plan.toUpperCase()})!`);
        setAdminRef("");
        setAdminTxnId("");
      } else {
        showError("Reference code not found.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to verify payment.");
    } finally {
      setVerifyingAdmin(false);
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#050505] text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              Billing &amp; Subscription
              <Badge variant="primary" className="text-xs">
                Payoneer Supported
              </Badge>
            </h1>
            <p className="text-sm text-muted mt-1">
              Manage your Hemix AI subscription, usage metrics, and Payoneer payment history.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSubscriptionData}
            className="self-start md:self-auto border-white/10 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Status
          </Button>
        </motion.div>

        {/* Current Plan Overview Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="relative overflow-hidden glass-card p-6 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-primary/10 via-white/[0.02] to-secondary/10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Current Plan
                  </span>
                  {activeSub?.status === "pending" ? (
                    <Badge variant="warning" className="animate-pulse flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Payment Under Review
                    </Badge>
                  ) : activeSub?.status === "active" ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" /> Active Subscription
                    </Badge>
                  ) : (
                    <Badge variant="default">Starter Free Tier</Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-extrabold text-white">{currentPlan.name}</h2>
                  <span className="text-xl font-bold text-primary">
                    {currentPlan.price === 0 ? "$0 / Forever" : `$${currentPlan.price} / ${currentPlan.period}`}
                  </span>
                </div>

                <p className="text-xs text-muted max-w-lg">{currentPlan.description}</p>

                {activeSub?.status === "active" && (
                  <div className="pt-2 text-xs text-muted flex items-center gap-4">
                    <span>
                      Start Date: <strong className="text-white">{formatDate(activeSub.startDate)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Next Renewal: <strong className="text-white">{formatDate(activeSub.endDate)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Ref: <strong className="text-primary font-mono">{activeSub.reference}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentPlan.id === "free" ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleOpenCheckout(PRICING_PLANS[1])}
                    className="shadow-lg shadow-primary/30"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Upgrade to Pro ($20/mo)
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handleOpenCheckout(PRICING_PLANS[2])}
                    >
                      Change Plan
                    </Button>
                    {activeSub?.status === "active" && (
                      <Button
                        variant="destructive"
                        size="md"
                        loading={loadingCancel}
                        onClick={handleCancelSubscription}
                      >
                        Cancel Plan
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Usage Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white/[0.02] border-white/10 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Messages Used Today</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold text-white">{dailyMessageCount}</span>
                  <span className="text-xs text-muted">
                    / {isUnlimited ? "Unlimited" : messageLimit}
                  </span>
                </div>
              </div>
            </div>
            {!isUnlimited && (
              <div className="mt-3">
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dailyMessageCount / messageLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-white/[0.02] border-white/10 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Saved Conversations</p>
                <p className="text-2xl font-bold text-white mt-0.5">{totalConversations}</p>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3">Active workspace threads stored</p>
          </Card>

          <Card className="bg-white/[0.02] border-white/10 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Payment Provider</p>
                <p className="text-2xl font-bold text-white mt-0.5">Payoneer</p>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3">Manual reference verification enabled</p>
          </Card>
        </div>

        {/* Pricing Tier Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Subscription Plans</h3>
            <span className="text-xs text-muted">All prices in USD. Cancel anytime.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan, index) => {
              const isCurrent = plan.id === currentPlan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={cn(
                    "glass-card p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative",
                    isCurrent
                      ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-xl shadow-primary/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-6">
                      <Badge variant="primary" className="text-[10px] uppercase font-bold tracking-wider py-1 px-3 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{plan.name}</h4>
                    <p className="text-xs text-muted mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                      <span className="text-xs text-muted">/{plan.period}</span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold text-white/80">Plan Features:</p>
                      <ul className="space-y-2">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <Button
                      variant={isCurrent ? "outline" : plan.popular ? "primary" : "secondary"}
                      className="w-full"
                      disabled={isCurrent}
                      onClick={() => handleOpenCheckout(plan)}
                    >
                      {isCurrent ? "Current Plan" : plan.cta}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Billing / Subscription History Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Payment &amp; Subscription History</h3>

          <Card className="p-0 overflow-hidden bg-white/[0.02] border-white/10 rounded-2xl">
            {history.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-muted mx-auto" />
                <p className="text-sm font-semibold text-white">No payment records found</p>
                <p className="text-xs text-muted">
                  When you subscribe or upgrade via Payoneer, your transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Reference Code</th>
                      <th className="px-5 py-3">Payoneer TXN ID</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-muted">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-white font-medium">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-5 py-4 capitalize font-semibold text-white">
                          {record.plan}
                        </td>
                        <td className="px-5 py-4 font-mono text-primary font-semibold">
                          {record.reference}
                        </td>
                        <td className="px-5 py-4 font-mono text-white/80">
                          {record.transactionId || "—"}
                        </td>
                        <td className="px-5 py-4 font-bold text-white">
                          ${record.amount}.00 USD
                        </td>
                        <td className="px-5 py-4">
                          {record.status === "active" && (
                            <Badge variant="success">Active</Badge>
                          )}
                          {record.status === "pending" && (
                            <Badge variant="warning">Under Review</Badge>
                          )}
                          {record.status === "cancelled" && (
                            <Badge variant="default">Cancelled</Badge>
                          )}
                          {record.status === "rejected" && (
                            <Badge variant="secondary">Rejected</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Admin Quick Verification Tool (for testing and manual verification) */}
        <div className="p-6 rounded-3xl glass-card border border-white/10 bg-white/[0.01] space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <h4 className="text-base font-bold text-white">Admin Payment Verification Endpoint</h4>
          </div>
          <p className="text-xs text-muted">
            Test and verify Payoneer transactions instantly by reference code. This simulates admin confirmation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              placeholder="Reference Code (e.g. HMX-XXXXXX)"
              value={adminRef}
              onChange={(e) => setAdminRef(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-muted focus:outline-none focus:border-secondary font-mono"
            />
            <input
              type="text"
              placeholder="Payoneer TXN ID (Optional)"
              value={adminTxnId}
              onChange={(e) => setAdminTxnId(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-muted focus:outline-none focus:border-secondary font-mono"
            />
            <Button
              variant="secondary"
              size="sm"
              loading={verifyingAdmin}
              onClick={handleAdminVerify}
              className="h-10 text-xs px-5"
            >
              Verify &amp; Activate
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={selectedPlanForCheckout}
        userId={userId}
        onSubscriptionCreated={handleSubscriptionCreated}
      />
    </div>
  );
}
