import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

/**
 * TTS API — uses ElevenLabs voice cloning to generate speech from text.
 * Falls back to a simple JSON response with instructions if no API key is set.
 *
 * Required env vars:
 * - ELEVENLABS_API_KEY: Your ElevenLabs API key
 * - ELEVENLABS_VOICE_ID: The cloned voice ID from ElevenLabs
 *
 * The voice sample is stored at public/voice/voice-sample.wav
 * Use /api/clone-voice to clone the voice first (one-time setup).
 */
export async function POST(req: NextRequest) {
  try {
    const { text, checkOnly } = await req.json();

    // Quick availability check — don't waste an API call
    if (checkOnly) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const voiceId = process.env.ELEVENLABS_VOICE_ID;
      if (!apiKey || !voiceId) {
        return NextResponse.json({ available: false }, { status: 503 });
      }
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

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    // If no ElevenLabs configured, return a flag so frontend falls back to browser TTS
    if (!apiKey || !voiceId) {
      return NextResponse.json(
        { error: "ElevenLabs not configured", fallback: true },
        { status: 503 }
      );
    }

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[api/tts] ElevenLabs error:", response.status, errorText);
      return NextResponse.json(
        { error: "TTS service error", fallback: true },
        { status: 502 }
      );
    }

    // Return audio as MP3
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[api/tts] error:", error);
    return NextResponse.json(
      { error: "Internal error", fallback: true },
      { status: 500 }
    );
  }
}
