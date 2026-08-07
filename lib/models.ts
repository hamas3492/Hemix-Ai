import type { AIModel } from "@/types";

export const AI_MODELS: AIModel[] = [
  // === AgentRouter Models (GPT-5.0, Claude 4.8, Claude 5) ===
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
  // === OpenAI ===
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's flagship model with vision and fast reasoning.",
    contextWindow: 128000,
    inputPrice: 5.0,
    outputPrice: 15.0,
    capabilities: ["Vision", "Code", "Reasoning", "Tools"],
    badge: "Popular",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Affordable and intelligent for everyday tasks.",
    contextWindow: 128000,
    inputPrice: 0.15,
    outputPrice: 0.6,
    capabilities: ["Code", "Reasoning", "Fast"],
    badge: "Fast",
  },
  // === Anthropic ===
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's best model for coding and analysis.",
    contextWindow: 200000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    capabilities: ["Code", "Analysis", "Writing", "Vision"],
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Powerful model for complex tasks.",
    contextWindow: 200000,
    inputPrice: 15.0,
    outputPrice: 75.0,
    capabilities: ["Reasoning", "Writing", "Analysis"],
  },
  // === Google ===
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Google's multimodal model with massive context.",
    contextWindow: 2000000,
    inputPrice: 1.25,
    outputPrice: 5.0,
    capabilities: ["Vision", "Audio", "Video", "Code"],
    badge: "2M Context",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and efficient model from Google.",
    contextWindow: 1000000,
    inputPrice: 0.075,
    outputPrice: 0.3,
    capabilities: ["Fast", "Vision", "Code"],
  },
  // === DeepSeek ===
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "deepseek",
    description: "High-performance open model with strong reasoning.",
    contextWindow: 64000,
    inputPrice: 0.27,
    outputPrice: 1.1,
    capabilities: ["Code", "Reasoning", "Math"],
  },
  // === Qwen ===
  {
    id: "qwen-max",
    name: "Qwen Max",
    provider: "qwen",
    description: "Alibaba's top model for multilingual tasks.",
    contextWindow: 32768,
    inputPrice: 2.8,
    outputPrice: 8.4,
    capabilities: ["Multilingual", "Code", "Reasoning"],
  },
  // === Llama ===
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "llama",
    description: "Meta's open-source model at scale.",
    contextWindow: 128000,
    inputPrice: 0.9,
    outputPrice: 0.9,
    capabilities: ["Code", "Reasoning", "Open Source"],
    badge: "Open Source",
  },
  // === Mistral ===
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "mistral",
    description: "Mistral's flagship model for enterprise.",
    contextWindow: 32000,
    inputPrice: 2.0,
    outputPrice: 6.0,
    capabilities: ["Code", "Reasoning", "Multilingual"],
  },
  // === OpenRouter ===
  {
    id: "openrouter/auto",
    name: "OpenRouter Auto",
    provider: "openrouter",
    description: "Automatically routes to the best model via OpenRouter.",
    contextWindow: 128000,
    inputPrice: 1.0,
    outputPrice: 1.0,
    capabilities: ["Auto-routing", "Multi-model"],
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL = "gpt-5.0";
