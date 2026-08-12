export type ModelProvider = "openai" | "anthropic" | "google" | "deepseek" | "qwen" | "llama" | "mistral" | "openrouter" | "agentrouter";

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  capabilities: string[];
  badge?: string;
  icon?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  model?: string;
  status?: "sending" | "streaming" | "complete" | "error";
  attachments?: FileAttachment[];
  edited?: boolean;
  type?: "text" | "image" | "file";
  imageUrl?: string;
  imagePrompt?: string;
  // New: message feedback
  liked?: boolean;
  disliked?: boolean;
  shared?: boolean;
  // New: voice transcript
  voiceTranscript?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  systemPrompt?: string;
  // New: personality setting
  personality?: PersonalityId;
}

export type PersonalityId = "friendly" | "professional" | "teacher" | "coding" | "creative" | "casual" | "concise";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  status: "active" | "revoked";
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  streamResponse: boolean;
}

export interface AppSettings {
  theme: "dark" | "light";
  language: string;
  notifications: boolean;
  keyboardShortcuts: boolean;
  privacy: {
    saveHistory: boolean;
    shareData: boolean;
  };
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

// Personality definitions
export const PERSONALITIES: Record<PersonalityId, { name: string; description: string; prompt: string }> = {
  friendly: {
    name: "Friendly",
    description: "Warm, casual, and approachable",
    prompt: "Be warm, friendly, and conversational. Use a casual tone as if talking to a good friend.",
  },
  professional: {
    name: "Professional",
    description: "Formal, precise, and business-like",
    prompt: "Be professional, precise, and formal. Use clear business language.",
  },
  teacher: {
    name: "Teacher",
    description: "Patient, educational, step-by-step",
    prompt: "Be like a patient teacher. Explain concepts step by step. Use examples and analogies.",
  },
  coding: {
    name: "Coding Expert",
    description: "Technical, detailed, code-focused",
    prompt: "Be a coding expert. Provide detailed technical answers with well-commented code. Always complete code blocks fully.",
  },
  creative: {
    name: "Creative",
    description: "Imaginative, expressive, and playful",
    prompt: "Be creative and imaginative. Use vivid language and creative examples.",
  },
  casual: {
    name: "Casual",
    description: "Relaxed, brief, and to the point",
    prompt: "Be casual and relaxed. Keep responses brief and to the point.",
  },
  concise: {
    name: "Concise",
    description: "Minimal words, maximum information",
    prompt: "Be extremely concise. Give the shortest useful answer possible. Skip pleasantries.",
  },
};
