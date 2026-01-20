import { NextRequest, NextResponse } from "next/server";

// Voice IDs from ElevenLabs - mix of masculine and feminine
const AGENT_VOICES: Record<string, string> = {
  validator: "ErXwobaYiN019PkySvjV", // Antoni - masculine (VEX)
  architect: "EXAVITQu4vr4xnSDxMaL", // Bella - feminine (ARC)
  analyst: "VR6AewLTigWG4xSOukaG", // Arnold - masculine (SCAN)
  reviewer: "MF3mGyEYCl7XYWbV9V6O", // Elli - feminine (FLUX)
  consensus: "TxGEqnHWrfWFTfGW9XjX", // Josh - masculine (SYNC)
  oracle: "XB0fDUnXU5powFXDhCwa", // Charlotte - feminine (SAGE)
};

export async function POST(req: NextRequest) {
  try {
    const { text, agentRole } = await req.json();

    if (!text || !agentRole) {
      return NextResponse.json(
        { error: "Missing text or agentRole" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const voiceId = AGENT_VOICES[agentRole] || AGENT_VOICES.validator;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.3,        // Lower = more expressive/dynamic
            similarity_boost: 0.8, // Keep voice identity
            style: 0.7,            // Higher = more dramatic/lively
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
