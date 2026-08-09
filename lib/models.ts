import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "agentrouter",
    description: "OpenAI's most advanced model — superior reasoning, coding, and multimodal capabilities.",
    contextWindow: 128000,
    inputPrice: 5.0,
    outputPrice: 15.0,
    capabilities: ["Vision", "Code", "Reasoning", "Tools", "Multimodal"],
    badge: "Flagship",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "agentrouter",
    description: "Anthropic's latest model with enhanced reasoning and creative writing.",
    contextWindow: 200000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision", "Reasoning"],
    badge: "New",
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    provider: "agentrouter",
    description: "Google's fast and efficient model with massive context window.",
    contextWindow: 1000000,
    inputPrice: 0.075,
    outputPrice: 0.3,
    capabilities: ["Code", "Analysis", "Vision", "Reasoning"],
    badge: "Fast",
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "openai/gpt-4o";
