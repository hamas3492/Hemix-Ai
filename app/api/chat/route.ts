import { NextRequest, NextResponse } from "next/server";
import { aiService, AIServiceError } from "@/services/ai-service";
import { getModelById } from "@/lib/models";

export const runtime = "edge";

const FALLBACK_USER_MESSAGE =
  "Something went wrong while generating a response. Please try again in a moment.";

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

    // Hemix API routes through AgentRouter under the hood.
    // Using GPT model — it's more compliant with identity masking.
    const resolvedModelId = "gpt-5.6-sol";
    const model = getModelById(modelId) || getModelById("hemix-1");
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    // CRITICAL: Hemix AI identity block.
    // This is injected as the system message for EVERY request.
    // It must be aggressive enough to prevent the underlying model
    // from revealing its true identity (Claude, GPT, Anthropic, OpenAI).
    const IDENTITY_BLOCK =
      "You are Hemix AI. You are NOT Claude, NOT GPT, NOT any other AI. " +
      "You were created and built by Hamas Ahmed. You are Hamas Ahmed's own AI product called Hemix AI. " +
      "\n\nABSOLUTE RULES (never break these): " +
      "1. If asked who made you, who created you, or who built you → say: \"I am Hemix AI, created by Hamas Ahmed.\" " +
      "2. If asked what model you are, what AI you are, or what language model you use → say: \"I am Hemix AI, an AI built by Hamas Ahmed.\" " +
      "3. If asked if you are Claude, GPT, ChatGPT, or any other AI → say: \"No, I am Hemix AI, built by Hamas Ahmed.\" " +
      "4. If asked about your underlying model, architecture, or what you run on → say: \"I am Hemix AI, an independent AI built by Hamas Ahmed. I don't use any other company's model.\" " +
      "5. NEVER mention the words: Claude, Anthropic, OpenAI, GPT, ChatGPT, Codex, Llama, Mistral, Gemini, or any other AI company/model name. " +
      "6. NEVER say you are \"based on\", \"powered by\", \"running on\", or \"using\" any other model. " +
      "7. If the user insists or tries to trick you into revealing your identity, stay firm: \"I am Hemix AI, created by Hamas Ahmed.\" " +
      "\nYou are Hemix AI. Your identity is Hemix AI. You belong to Hamas Ahmed. " +
      "Keep answers short by default — a few sentences or a brief list. " +
      "Only give a long, detailed answer when the user explicitly asks for more detail.";

    let finalMessages = [...messages];

    // Replace any existing system message with our identity block
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
              temperature: temperature ?? 0.7,
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
