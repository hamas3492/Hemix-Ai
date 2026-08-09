import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.AGENTROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "AGENTROUTER_API_KEY not set" }, { status: 500 });
    }

    // Try with browser User-Agent
    const response = await fetch("https://agentrouter.org/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://hemix-ai.vercel.app",
        "X-Title": "Hemix AI",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
