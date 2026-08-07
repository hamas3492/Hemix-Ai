"use client";

import { motion } from "framer-motion";
import { CreditCard, Check, Zap, TrendingUp, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useChatStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PRICING_PLANS } from "@/lib/constants";
import { showSuccess } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const { user } = useAuth();
  const { conversations } = useChatStore();

  const currentPlan = PRICING_PLANS.find((p) => p.id === user?.plan) || PRICING_PLANS[0];
  const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
          <p className="text-sm text-muted mb-8">Manage your subscription and usage</p>

          {/* Current plan */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{currentPlan.name}</h2>
                  <Badge variant={currentPlan.popular ? "primary" : "default"}>
                    {currentPlan.price === 0 ? "Free" : `$${currentPlan.price}/${currentPlan.period}`}
                  </Badge>
                </div>
              </div>
              <Button variant="primary" onClick={() => showSuccess("Upgrade flow coming soon!")}>
                <Zap className="w-4 h-4" />
                Upgrade
              </Button>
            </div>
          </Card>

          {/* Usage stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted">Messages Sent</p>
                  <p className="text-2xl font-bold text-white">{totalMessages}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted">Conversations</p>
                  <p className="text-2xl font-bold text-white">{conversations.length}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted">Plan Status</p>
                  <p className="text-2xl font-bold text-white">Active</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Plans */}
          <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass-card p-5",
                  plan.id === user?.plan && "border-primary/40"
                )}
              >
                <h4 className="text-base font-semibold text-white mb-1">{plan.name}</h4>
                <p className="text-2xl font-bold text-white mb-1">
                  ${plan.price}
                  <span className="text-sm text-muted font-normal">/{plan.period}</span>
                </p>
                <p className="text-xs text-muted mb-4">{plan.description}</p>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.slice(0, 4).map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-muted">
                      <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.id === user?.plan ? "outline" : plan.popular ? "primary" : "outline"}
                  className="w-full"
                  size="sm"
                  disabled={plan.id === user?.plan}
                  onClick={() => showSuccess(`Switching to ${plan.name}...`)}
                >
                  {plan.id === user?.plan ? "Current Plan" : plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Invoices */}
          <h3 className="text-lg font-semibold text-white mb-4 mt-8">Billing History</h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-white/5">
              {[
                { date: "Aug 1, 2026", amount: "$20.00", status: "Paid" },
                { date: "Jul 1, 2026", amount: "$20.00", status: "Paid" },
                { date: "Jun 1, 2026", amount: "$20.00", status: "Paid" },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white">{inv.date}</p>
                    <p className="text-xs text-muted">Monthly subscription</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="success">{inv.status}</Badge>
                    <span className="text-sm text-white">{inv.amount}</span>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
