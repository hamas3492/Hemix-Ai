import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "agentrouter",
    description: "Automatically picks the best model for your query.",
    contextWindow: 200000,
    inputPrice: 0,
    outputPrice: 0,
    capabilities: ["Auto", "Smart"],
    badge: "Default",
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "agentrouter",
    description: "Our most powerful model — elite reasoning, coding, and creative capabilities.",
    contextWindow: 200000,
    inputPrice: 15.0,
    outputPrice: 75.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision", "Reasoning", "Tools"],
    badge: "Flagship",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "agentrouter",
    description: "Advanced reasoning and coding with exceptional long-context performance.",
    contextWindow: 200000,
    inputPrice: 10.0,
    outputPrice: 40.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision", "Reasoning"],
    badge: "New",
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "agentrouter",
    description: "Latest-gen model with superior multimodal and coding capabilities.",
    contextWindow: 128000,
    inputPrice: 8.0,
    outputPrice: 24.0,
    capabilities: ["Vision", "Code", "Reasoning", "Tools", "Multimodal"],
    badge: "Best for Code",
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "claude-opus-4-8";
