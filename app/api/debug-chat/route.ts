import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime (AWS Lambda) instead of Edge
export const runtime = "nodejs";

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
      contentType: response.headers.get("content-type"),
      body: body.substring(0, 500),
      isHTML: body.includes("<!doctype") || body.includes("<html"),
      runtime: "nodejs",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
