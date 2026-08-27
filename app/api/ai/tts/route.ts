import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, trainerName } = await req.json();

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("Missing ELEVENLABS_API_KEY in .env.local");
      return NextResponse.json({ error: "TTS key missing" }, { status: 500 });
    }

    // Default High-Quality ElevenLabs Voices 
    let voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam (Deep, clear male)
    
    if (trainerName === "Coach Tara") {
      voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (Professional Female)
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2", // Safer fallback for all tiers
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", errorText);
      return NextResponse.json({ error: `ElevenLabs Error: ${errorText}` }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
