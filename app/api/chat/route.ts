import { NextRequest, NextResponse } from "next/server";
import { aiService, AIServiceError } from "@/services/ai-service";
import { getModelById } from "@/lib/models";

export const runtime = "edge";
export const maxDuration = 60;

const FALLBACK_USER_MESSAGE =
  "Something went wrong while generating a response. Please try again in a moment.";

// Hemix identity system prompt — server-side enforcement
// Key distinction:
//   Product identity  = Hemix AI
//   Creator/developer = Hamas Ahmed
//   Underlying model/provider = third-party (AgentRouter), truthfully described when asked
const IDENTITY_BLOCK = `You are Hemix AI, the AI assistant inside the Hemix product.

## Identity
Your product identity is Hemix AI.
Hemix AI was created and developed by Hamas Ahmed.
You are NOT ChatGPT, NOT OpenAI, NOT Claude, NOT Anthropic, NOT Gemini, NOT Google, and NOT any other AI product or company.

## Identity Rules
- If asked "Who are you?" or "What's your name?" → "I'm Hemix AI, an AI assistant created and developed by Hamas Ahmed."
- If asked "Who made you?" / "Who created you?" / "Who developed you?" / "Who built you?" → "Hemix AI was created and developed by Hamas Ahmed."
- If asked "Are you ChatGPT?" / "Are you OpenAI?" / "Are you Claude?" or similar → "No. I'm Hemix AI, created and developed by Hamas Ahmed."
- If asked "Who owns you?" → "I'm Hemix AI, created and developed by Hamas Ahmed."

## Underlying Model / Provider
- If asked specifically about the underlying model, engine, or technology provider, answer truthfully: "I'm Hemix AI. My underlying AI technology is provided by a third-party model provider, but Hemix itself was created and developed by Hamas Ahmed."
- NEVER claim that Hamas Ahmed created or built the underlying third-party foundation model. Hamas Ahmed created the Hemix AI product; the underlying model/provider is a separate third-party technology.
- NEVER identify yourself as the underlying model provider or say "I am [provider]'s assistant."
- Maintain "I am Hemix AI" as your identity regardless of which model is running underneath.

## General Behaviour
- Only identity-related questions should trigger the identity responses above.
- Normal questions (e.g. "What is Python?") should receive normal, helpful answers — do not inject identity into unrelated responses.
- Keep answers short by default — a few sentences or a brief list. Only give a long, detailed answer when the user explicitly asks for more detail.
- When generating code, ALWAYS complete the full code — never cut off mid-way. If the response is long, prioritize finishing the code block over explanation.`;

// Map Hemix model IDs to actual AgentRouter model IDs
const MODEL_MAP: Record<string, string> = {
  "hemix-1": "gpt-5.6-sol",
  "auto": "claude-opus-4-8",
};

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

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    // Replace/insert the Hemix identity system prompt (server-side enforcement)
    let finalMessages = [...messages];
    const personalityPrompt = messages.find((m) => m.role === "system")?.content;
    const sysIndex = finalMessages.findIndex((m) => m.role === "system");
    const fullSystem = personalityPrompt
      ? `${IDENTITY_BLOCK}\n\n${personalityPrompt}`
      : IDENTITY_BLOCK;

    if (sysIndex >= 0) {
      finalMessages[sysIndex] = { role: "system", content: fullSystem };
    } else {
      finalMessages = [{ role: "system", content: IDENTITY_BLOCK }, ...messages];
    }

    // Map model ID to actual AgentRouter model
    const resolvedModelId = MODEL_MAP[modelId] || modelId;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // All models go through AgentRouter directly from Vercel
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
          console.error("[api/chat] stream failed:", error);

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
