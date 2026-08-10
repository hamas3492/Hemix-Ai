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

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of aiService.streamChat(
            {
              model: modelId,
              messages,
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
          // Full diagnostic detail (provider, status, raw body, env var names)
          // stays in server logs only — never sent to the client.
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
