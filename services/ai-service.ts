import type { AIModel, ModelProvider } from "@/types";

export interface ChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  apiKey?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Internal error carrying full diagnostic detail for server-side logs only.
 * Never expose `.detail` to end users — use `.userMessage` for anything
 * rendered in the UI.
 */
export class AIServiceError extends Error {
  public readonly userMessage: string;
  public readonly detail: string;

  constructor(userMessage: string, detail: string) {
    super(detail);
    this.name = "AIServiceError";
    this.userMessage = userMessage;
    this.detail = detail;
  }
}

const GENERIC_UNAVAILABLE_MESSAGE =
  "Hemix AI is temporarily unable to reach this model's provider. Please try again in a moment or switch to a different model.";

export class AIService {
  private getProviderConfig(provider: ModelProvider): { baseUrl: string; envKey: string } {
    const configs: Record<ModelProvider, { baseUrl: string; envKey: string }> = {
      openai: { baseUrl: "https://api.openai.com/v1", envKey: "OPENAI_API_KEY" },
      anthropic: { baseUrl: "https://api.anthropic.com/v1", envKey: "ANTHROPIC_API_KEY" },
      google: { baseUrl: "https://generativelanguage.googleapis.com/v1", envKey: "GOOGLE_API_KEY" },
      deepseek: { baseUrl: "https://api.deepseek.com/v1", envKey: "DEEPSEEK_API_KEY" },
      qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", envKey: "QWEN_API_KEY" },
      llama: { baseUrl: "https://api.together.xyz/v1", envKey: "LLAMA_API_KEY" },
      mistral: { baseUrl: "https://api.mistral.ai/v1", envKey: "MISTRAL_API_KEY" },
      openrouter: { baseUrl: "https://openrouter.ai/api/v1", envKey: "OPENROUTER_API_KEY" },
      agentrouter: { baseUrl: "https://api.agentrouter.com/v1", envKey: "AGENTROUTER_API_KEY" },
    };
    return configs[provider];
  }

  private getApiKey(provider: ModelProvider, customKey?: string): string {
    if (customKey) return customKey;
    const config = this.getProviderConfig(provider);
    const key = process.env[config.envKey];
    if (!key) {
      // Detailed diagnostic (env var name, provider) is for server logs ONLY.
      throw new AIServiceError(
        GENERIC_UNAVAILABLE_MESSAGE,
        `API key not configured for provider: ${provider}. Set ${config.envKey} in your environment variables.`
      );
    }
    return key;
  }

  private getExtraHeaders(provider: ModelProvider): Record<string, string> {
    if (provider === "openrouter" || provider === "agentrouter") {
      return {
        "HTTP-Referer": "https://hemix.ai",
        "X-Title": "Hemix AI",
      };
    }
    return {};
  }

  async *streamChat(request: ChatRequest, model: AIModel): AsyncGenerator<string, void, unknown> {
    const config = this.getProviderConfig(model.provider);
    const apiKey = this.getApiKey(model.provider, request.apiKey);
    const extraHeaders = this.getExtraHeaders(model.provider);

    let response: Response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4096,
            top_p: request.topP ?? 1,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          // Raw provider error body may contain sensitive details — keep server-side only.
          throw new AIServiceError(GENERIC_UNAVAILABLE_MESSAGE, `API error ${response.status}: ${errorBody}`);
        }

        break;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }

    const reader = response!.body?.getReader();
    if (!reader) throw new AIServiceError(GENERIC_UNAVAILABLE_MESSAGE, "No response body from provider");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          continue;
        }
      }
    }
  }

  async chat(request: ChatRequest, model: AIModel): Promise<ChatResponse> {
    const config = this.getProviderConfig(model.provider);
    const apiKey = this.getApiKey(model.provider, request.apiKey);
    const extraHeaders = this.getExtraHeaders(model.provider);

    let response: Response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4096,
            top_p: request.topP ?? 1,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new AIServiceError(GENERIC_UNAVAILABLE_MESSAGE, `API error ${response.status}: ${errorBody}`);
        }

        break;
      } catch (error) {
        retries++;
        if (retries > maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }

    const data = await response!.json();
    return {
      content: data.choices[0].message.content,
      model: data.model || request.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}

export const aiService = new AIService();
