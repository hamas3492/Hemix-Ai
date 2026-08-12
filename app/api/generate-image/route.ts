import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

const HEMIX_IMAGE_API = "https://solas-92177755.base44.app/functions/hemixGenerateImage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Use higher resolution for better quality
    const width = body.width ?? 1024;
    const height = body.height ?? 1024;

    const response = await fetch(HEMIX_IMAGE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        width,
        height,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Image generation failed", details: errText.substring(0, 200) },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status === "ok" && data.image_url) {
      return NextResponse.json({
        url: data.image_url,
        prompt: data.prompt,
        width: data.width,
        height: data.height,
      });
    }

    return NextResponse.json(
      { error: data.error || "No image URL returned" },
      { status: 502 }
    );
  } catch (error) {
    console.error("[api/generate-image] error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
