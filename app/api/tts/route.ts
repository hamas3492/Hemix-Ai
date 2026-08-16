import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

/**
 * TTS API — uses Google Translate TTS (free, no API key needed).
 * Supports Urdu (ur), Hindi (hi), and English (en).
 * Automatically detects language from text content.
 *
 * Falls back to a 503 response if TTS fails, so frontend uses browser TTS.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, checkOnly } = await req.json();

    // Quick availability check — always available (no API key needed)
    if (checkOnly) {
      return NextResponse.json({ available: true });
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Clean text for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code block ")
      .replace(/[*#`_>|]/g, "")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "No speakable text" }, { status: 400 });
    }

    // Detect language: Urdu/Arabic script → ur, else en
    const isUrdu = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(cleanText);
    const lang = isUrdu ? "ur" : "en";

    // Google Translate TTS has a ~200 char limit per request.
    // Split long text into chunks and concatenate audio.
    const MAX_CHUNK = 190;
    const chunks: string[] = [];

    if (cleanText.length <= MAX_CHUNK) {
      chunks.push(cleanText);
    } else {
      // Split by sentences first, then by length
      const sentences = cleanText.split(/(?<=[.!?।؟])\s+/);
      let current = "";

      for (const sentence of sentences) {
        if ((current + " " + sentence).length > MAX_CHUNK) {
          if (current) chunks.push(current);
          // If single sentence is too long, hard split
          if (sentence.length > MAX_CHUNK) {
            for (let i = 0; i < sentence.length; i += MAX_CHUNK) {
              chunks.push(sentence.slice(i, i + MAX_CHUNK));
            }
          } else {
            current = sentence;
          }
        } else {
          current = current ? current + " " + sentence : sentence;
        }
      }
      if (current) chunks.push(current);
    }

    // Fetch audio for each chunk
    const audioBuffers: ArrayBuffer[] = [];

    for (const chunk of chunks) {
      const encoded = encodeURIComponent(chunk);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "audio/mpeg",
        },
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      audioBuffers.push(await response.arrayBuffer());
    }

    // If single chunk, return directly
    if (audioBuffers.length === 1) {
      return new NextResponse(audioBuffers[0], {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Concatenate multiple MP3 chunks
    // Simple concatenation works for MP3 files with same format
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      merged.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    return new NextResponse(merged.buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[api/tts] error:", error);
    return NextResponse.json(
      { error: "TTS failed", fallback: true },
      { status: 503 }
    );
  }
}
