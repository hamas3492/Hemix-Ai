import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * One-time voice cloning API — uploads the voice sample at public/voice/voice-sample.wav
 * to ElevenLabs and creates a cloned voice. Returns the voice ID to save as
 * ELEVENLABS_VOICE_ID env var.
 *
 * Required env var: ELEVENLABS_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ELEVENLABS_API_KEY not set. Please add your ElevenLabs API key to environment variables.",
        },
        { status: 400 }
      );
    }

    // Read the voice sample file
    const voicePath = join(process.cwd(), "public", "voice", "voice-sample.wav");
    let voiceFile: Buffer;
    try {
      voiceFile = readFileSync(voicePath);
    } catch {
      return NextResponse.json(
        {
          error:
            "Voice sample not found at public/voice/voice-sample.wav. Please upload your voice file first.",
        },
        { status: 400 }
      );
    }

    // Convert buffer to base64 for multipart form
    const formData = new FormData();
    formData.append("name", "Hemix AI Voice");
    formData.append(
      "files",
      new Blob([voiceFile], { type: "audio/wav" }),
      "voice-sample.wav"
    );
    formData.append("description", "Custom voice for Hemix AI");

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[api/clone-voice] ElevenLabs error:", response.status, errorText);
      return NextResponse.json(
        { error: `Voice cloning failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const voiceId = data.voice_id;

    if (!voiceId) {
      return NextResponse.json(
        { error: "Voice cloning succeeded but no voice ID returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voiceId,
      message:
        "Voice cloned successfully! Save this voice ID as ELEVENLABS_VOICE_ID in your environment variables.",
    });
  } catch (error) {
    console.error("[api/clone-voice] error:", error);
    return NextResponse.json(
      { error: "Internal error during voice cloning" },
      { status: 500 }
    );
  }
}
