import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  {
    id: "hemix-1",
    name: "Hemix API",
    provider: "agentrouter",
    description: "Hemix's own AI model — fast, smart, and built by Hamas Ahmed.",
    contextWindow: 200000,
    inputPrice: 0,
    outputPrice: 0,
    capabilities: ["Chat", "Reasoning", "Writing", "Code"],
    badge: "Hemix",
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "hemix-1";
