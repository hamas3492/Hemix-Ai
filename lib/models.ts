import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-5.0",
    name: "GPT-5.0",
    provider: "agentrouter",
    description: "OpenAI's most advanced model — superior reasoning, coding, and multimodal capabilities.",
    contextWindow: 256000,
    inputPrice: 10.0,
    outputPrice: 30.0,
    capabilities: ["Vision", "Code", "Reasoning", "Tools", "Multimodal"],
    badge: "Flagship",
  },
  {
    id: "claude-5-sonnet",
    name: "Claude 5 Sonnet",
    provider: "agentrouter",
    description: "Anthropic's next-gen model with enhanced reasoning and creative writing.",
    contextWindow: 200000,
    inputPrice: 5.0,
    outputPrice: 25.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision", "Reasoning"],
    badge: "New",
  },
  {
    id: "claude-4.8",
    name: "Claude 4.8",
    provider: "agentrouter",
    description: "Claude 4.8 — exceptional at coding, analysis, and long-context tasks.",
    contextWindow: 200000,
    inputPrice: 4.0,
    outputPrice: 20.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision"],
    badge: "Best for Code",
  },
  {
    id: "agentrouter/auto",
    name: "AgentRouter Auto",
    provider: "agentrouter",
    description: "Automatically routes to the best model for your query.",
    contextWindow: 256000,
    inputPrice: 1.0,
    outputPrice: 1.0,
    capabilities: ["Auto-routing", "Multi-model", "Smart"],
    badge: "Smart Routing",
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "gpt-5.0";
