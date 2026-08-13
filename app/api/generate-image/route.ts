import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

// Keywords that indicate the user wants a non-photographic style —
// in these cases we don't force photorealism on top of their request.
const STYLIZED_KEYWORDS = [
  "cartoon", "anime", "illustration", "drawing", "sketch", "painting", "watercolor",
  "3d render", "pixel art", "comic", "manga", "vector art", "line art", "doodle",
  "clipart", "clip art", "minimalist", "abstract art", "cubist", "pop art",
  "low poly", "isometric", "flat design", "chibi", "caricature",
];

function isStylizedRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return STYLIZED_KEYWORDS.some((kw) => lower.includes(kw));
}

// Premium photorealism boosters — appended only when the request looks like
// it wants a realistic photo (the default, ChatGPT-like behaviour).
const REALISM_SUFFIX =
  "photorealistic, ultra realistic, professional photography, DSLR, sharp focus, " +
  "natural lighting, high dynamic range, intricate detail, 8k uhd, high resolution";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const width = Math.min(Math.max(body.width ?? 1024, 512), 1536);
    const height = Math.min(Math.max(body.height ?? 1024, 512), 1536);

    const stylized = isStylizedRequest(prompt);
    const finalPrompt = stylized ? prompt.trim() : `${prompt.trim()}, ${REALISM_SUFFIX}`;
    const model = stylized ? "flux" : "flux-realism";
    const seed = Math.floor(Math.random() * 1_000_000_000);

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}` +
      `?width=${width}&height=${height}&nologo=true&model=${model}&seed=${seed}&enhance=true`;

    return NextResponse.json({
      url,
      prompt: prompt.trim(),
      width,
      height,
    });
  } catch (error) {
    console.error("[api/generate-image] error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
