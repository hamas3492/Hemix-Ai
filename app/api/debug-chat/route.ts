import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.AGENTROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "AGENTROUTER_API_KEY not set" }, { status: 500 });
    }

    const response = await fetch("https://agentrouter.org/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://hemix-ai.vercel.app",
        "X-Title": "Hemix AI",
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 20,
        stream: false,
      }),
    });

    const body = await response.text();
    
    return NextResponse.json({
      status: response.status,
      body: body.substring(0, 500),
      keyPrefix: apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
