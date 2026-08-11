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
}

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
