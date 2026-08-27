import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kineticDamage = body.kineticDamage || "No kinetic damage reported.";
    const fuelPayloads = body.fuelPayloads || "No fuel payloads reported.";

    const prompt = `
      You are an elite tactical military fitness and recovery coach.
      The operative has completed their daily mission.
      Here is the day's kinetic damage (workout data): ${typeof kineticDamage === 'string' ? kineticDamage : JSON.stringify(kineticDamage)}
      Here are the day's fuel payloads (nutrition data): ${typeof fuelPayloads === 'string' ? fuelPayloads : JSON.stringify(fuelPayloads)}

      Generate strict overnight directives for recovery (e.g., vertical digestion, sleep protocol).
      Lock in the objective for tomorrow.
      ZERO EMOJIS.
      End your response with ONE specific question about their physical state or deployment readiness.

      Respond strictly in the following JSON format without any markdown wrappers or extra text:
      {
        "overnightDirectives": "Strict tactical instructions for overnight recovery and sleep.",
        "tomorrowObjective": "The primary tactical objective for tomorrow based on today's kinetic damage.",
        "finalAssessment": "A brief, intense closing statement ending with ONE specific question about their physical state or deployment. ZERO EMOJIS."
      }
    `;

    const generatedResult = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const textRes = generatedResult.text || "{}";
    const parsedData = JSON.parse(textRes);

    return NextResponse.json({ success: true, shutdownProtocol: parsedData });
  } catch (error: any) {
    console.error("AI Shutdown Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate shutdown protocol", details: error.message },
      { status: 500 }
    );
  }
}
