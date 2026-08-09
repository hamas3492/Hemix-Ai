import { AI_MODELS } from "@/lib/models";

export const DAILY_MESSAGE_LIMIT = 10;

export function getMessageLimit(plan?: string): number {
  if (plan === "pro" || plan === "enterprise") {
    return Infinity;
  }
  return DAILY_MESSAGE_LIMIT;
}

export function getModelAccess(plan?: string): string[] {
  if (plan === "pro" || plan === "enterprise") {
    return AI_MODELS.map((m) => m.id);
  }
  return ["agentrouter/auto"];
}

export function canUseModel(plan: string | undefined, modelId: string): boolean {
  if (plan === "pro" || plan === "enterprise") {
    return true;
  }
  return modelId === "agentrouter/auto";
}
