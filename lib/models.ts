import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "agentrouter",
    description: "OpenAI's most advanced model — superior reasoning, coding, and multimodal capabilities.",
    contextWindow: 128000,
    inputPrice: 10.0,
    outputPrice: 30.0,
    capabilities: ["Vision", "Code", "Reasoning", "Tools", "Multimodal"],
    badge: "Flagship",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "agentrouter",
    description: "Anthropic's latest model with enhanced reasoning and creative writing.",
    contextWindow: 1000000,
    inputPrice: 6.0,
    outputPrice: 30.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision", "Reasoning"],
    badge: "New",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "agentrouter",
    description: "Exceptional at coding, analysis, and long-context tasks.",
    contextWindow: 200000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision"],
    badge: "Best for Code",
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "gpt-5";
