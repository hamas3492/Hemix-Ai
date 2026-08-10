import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const regions = ["sin1"]; // Singapore

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
        "Authorization": `Bearer ${apiKey}`,
        "Originator": "codex_cli_rs",
        "User-Agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464",
        "Version": "0.101.0"
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 20,
        stream: false
      }),
    });

    const body = await response.text();
    
    return NextResponse.json({
      status: response.status,
      contentType: response.headers.get("content-type"),
      isHTML: body.includes("<!doctype") || body.includes("<html"),
      body: body.substring(0, 400),
      region: "sin1"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
