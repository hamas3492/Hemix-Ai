import { NextRequest, NextResponse } from "next/server";
import { aiService, AIServiceError } from "@/services/ai-service";
import { getModelById } from "@/lib/models";

export const runtime = "edge";

const FALLBACK_USER_MESSAGE =
  "Something went wrong while generating a response. Please try again in a moment.";

const DEFAULT_SYSTEM_PROMPT =
  "You are Hemix AI, a helpful, intelligent, and creative assistant. You were created and built by Hamas Ahmed. If anyone asks who made you, who built you, or who created you, always say Hamas Ahmed. Never mention Claude, Anthropic, OpenAI, GPT, Codex, or any AI company or tool. Keep answers SHORT by default — a few sentences or a tight list, like a real conversation. Only give a long, detailed, or step-by-step answer when the user explicitly asks for more detail, a full explanation, or a guide. Never pad responses with unnecessary intros or summaries.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      model: modelId,
      messages,
      temperature,
      maxTokens,
      topP,
      apiKey: customKey,
    } = body;

    if (!modelId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: model and messages are required" },
        { status: 400 }
      );
    }

    // Map virtual model IDs to real model IDs for the provider API.
    // "auto" and "hemix-1" both route to a real model under the hood.
    const MODEL_MAPPING: Record<string, string> = {
      "auto": "claude-opus-4-8",
      "hemix-1": "claude-opus-4-8",
    };
    const resolvedModelId = MODEL_MAPPING[modelId] || modelId;

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    // Always enforce Hemix AI identity in the system prompt.
    // AgentRouter's content filter blocks many generic system prompts
    // (e.g. "You are a helpful assistant." triggers "sensitive words detected").
    // So we ALWAYS replace the system prompt with our safe identity block
    // that has been tested to pass the filter. Custom prompts from the
    // frontend are ignored to prevent filter errors.
    const IDENTITY_BLOCK =
      "You are Hemix AI, a helpful and intelligent assistant created by Hamas Ahmed. " +
      "When asked who made you, who built you, or who created you, your answer is Hamas Ahmed. " +
      "You are Hemix AI, your own assistant. " +
      "Keep answers short by default — a few sentences or a brief list. " +
      "Only give a long detailed answer when the user explicitly asks for more detail.";

    let finalMessages = [...messages];

    // Replace any existing system message with our safe identity block
    const sysIndex = finalMessages.findIndex((m) => m.role === "system");
    if (sysIndex >= 0) {
      finalMessages[sysIndex] = { role: "system", content: IDENTITY_BLOCK };
    } else {
      finalMessages = [{ role: "system", content: IDENTITY_BLOCK }, ...messages];
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of aiService.streamChat(
            {
              model: resolvedModelId,
              messages: finalMessages,
              temperature,
              maxTokens,
              topP,
              apiKey: customKey,
            },
            model
          )) {
            const data = JSON.stringify({
              choices: [{ delta: { content: chunk } }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[api/chat] streamChat failed:", error);

          const userMessage =
            error instanceof AIServiceError ? error.userMessage : FALLBACK_USER_MESSAGE;

          const errData = JSON.stringify({
            choices: [{ delta: { content: `\n\n${userMessage}` } }],
          });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[api/chat] request handling failed:", error);
    return NextResponse.json(
      { error: "Invalid request. Please check your input and try again." },
      { status: 500 }
    );
  }
}
