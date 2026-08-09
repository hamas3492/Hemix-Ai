import { PRICING_PLANS } from "@/lib/constants";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: "free" | "pro" | "enterprise";
  status: "pending" | "active" | "cancelled" | "rejected";
  amount: number;
  reference: string;
  transactionId?: string;
  payoneerEmail: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentInstructions {
  payoneerEmail: string;
  plan: string;
  planName: string;
  amount: number;
  currency: string;
  reference: string;
  instructions: string[];
}

const STORAGE_KEY = "hemix_subscriptions";

let memorySubscriptions: SubscriptionRecord[] = [];

function getSubscriptionsFromStorage(): SubscriptionRecord[] {
  if (typeof window === "undefined") {
    return memorySubscriptions;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memorySubscriptions;
    return JSON.parse(raw);
  } catch {
    return memorySubscriptions;
  }
}

function saveSubscriptionsToStorage(subs: SubscriptionRecord[]): void {
  memorySubscriptions = subs;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    } catch (e) {
      console.error("Failed to save subscriptions to localStorage:", e);
    }
  }
}

export function generateReferenceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "HMX-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getPayoneerEmail(): string {
  return (
    process.env.PAYONEER_EMAIL ||
    process.env.NEXT_PUBLIC_PAYONEER_EMAIL ||
    "payments@hemix.ai"
  );
}

export class PaymentService {
  getPayoneerEmail(): string {
    return getPayoneerEmail();
  }

  getPaymentInstructions(plan: string, customReference?: string): PaymentInstructions {
    const planInfo = PRICING_PLANS.find((p) => p.id === plan) || PRICING_PLANS[1];
    const reference = customReference || generateReferenceCode();
    const email = getPayoneerEmail();

    return {
      payoneerEmail: email,
      plan: planInfo.id,
      planName: planInfo.name,
      amount: planInfo.price,
      currency: "USD",
      reference,
      instructions: [
        `Log in to your Payoneer account or open the Payoneer mobile app.`,
        `Select "Make a Payment" or "Pay to a Recipient's Payoneer Account".`,
        `Enter our official Payoneer receiving email: ${email}`,
        `Enter the total subscription amount: $${planInfo.price} USD.`,
        `IMPORTANT: Include your Reference Code (${reference}) in the Payment Notes/Description field.`,
        `Complete the transfer and save your Payoneer Transaction ID.`,
        `Submit your Transaction ID to initiate admin verification and activate your subscription.`,
      ],
    };
  }

  createSubscription(
    userId: string,
    plan: "pro" | "enterprise",
    customReference?: string,
    transactionId?: string
  ): { subscription: SubscriptionRecord; instructions: PaymentInstructions; reference: string } {
    const reference = customReference || generateReferenceCode();
    const instructions = this.getPaymentInstructions(plan, reference);
    const now = new Date().toISOString();

    const newSub: SubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      plan,
      status: "pending",
      amount: instructions.amount,
      reference,
      transactionId: transactionId || "",
      payoneerEmail: instructions.payoneerEmail,
      createdAt: now,
      updatedAt: now,
    };

    const subs = getSubscriptionsFromStorage();
    const updated = [newSub, ...subs.filter((s) => s.reference !== reference)];
    saveSubscriptionsToStorage(updated);

    return {
      subscription: newSub,
      instructions,
      reference,
    };
  }

  submitTransactionId(reference: string, transactionId: string): SubscriptionRecord | null {
    const subs = getSubscriptionsFromStorage();
    const idx = subs.findIndex((s) => s.reference === reference);
    if (idx === -1) return null;

    subs[idx] = {
      ...subs[idx],
      transactionId,
      status: "pending",
      updatedAt: new Date().toISOString(),
    };
    saveSubscriptionsToStorage(subs);
    return subs[idx];
  }

  verifyPayment(reference: string, transactionId?: string): SubscriptionRecord | null {
    const subs = getSubscriptionsFromStorage();
    const idx = subs.findIndex(
      (s) => s.reference === reference || (transactionId && s.transactionId === transactionId)
    );

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (idx !== -1) {
      subs[idx] = {
        ...subs[idx],
        status: "active",
        transactionId: transactionId || subs[idx].transactionId,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        updatedAt: now.toISOString(),
      };
      saveSubscriptionsToStorage(subs);
      return subs[idx];
    }

    const newSub: SubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: "user_verified",
      plan: "pro",
      status: "active",
      amount: 20,
      reference,
      transactionId: transactionId || `TXN-${Date.now()}`,
      payoneerEmail: getPayoneerEmail(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    };
    saveSubscriptionsToStorage([newSub, ...subs]);
    return newSub;
  }

  getSubscription(userId: string): SubscriptionRecord | null {
    const subs = getSubscriptionsFromStorage();
    const userSubs = subs.filter((s) => s.userId === userId);
    
    const active = userSubs.find((s) => s.status === "active");
    if (active) return active;

    const pending = userSubs.find((s) => s.status === "pending");
    if (pending) return pending;

    return userSubs[0] || null;
  }

  getUserSubscriptions(userId: string): SubscriptionRecord[] {
    const subs = getSubscriptionsFromStorage();
    return subs.filter((s) => s.userId === userId);
  }

  cancelSubscription(userId: string): SubscriptionRecord | null {
    const subs = getSubscriptionsFromStorage();
    const idx = subs.findIndex((s) => s.userId === userId && s.status === "active");
    if (idx === -1) return null;

    subs[idx] = {
      ...subs[idx],
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };
    saveSubscriptionsToStorage(subs);
    return subs[idx];
  }
}

export const paymentService = new PaymentService();
