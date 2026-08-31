import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { saveWorkoutPlan } from "@/lib/dynamodb";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });
const MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];

async function generateWithFallback(aiClient: any, payload: any) {
  let lastError: any = null;
  for (const model of MODELS) {
    try {
      return await aiClient.models.generateContent({ ...payload, model });
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error?.message || error);
      lastError = error;
    }
  }
  throw new Error("All backup AI models are exhausted or rate-limited. " + (lastError?.message || ""));
}

export async function POST(req: Request) {
  try {
    const { sport, timeframe, history, litmusResult, bioData } = await req.json();

    const systemPrompt = `SYS_ARCH: ELITE_SPORTS_COACH.
SPORT:${sport} TIMEFRAME:${timeframe}
HIST:${history} LITMUS:${litmusResult||"N/A"}
BIO:${JSON.stringify(bioData||{})}

MISSION: Generate a highly specific 7-Day Athletic Periodization Matrix (JSON array).
CRITICAL DIRECTIVE: You are coaching the ACTUAL SPORT (e.g., track running, boxing drills, soccer practice), NOT just assigning gym weights for athletes. 
If the sport is running (like "2K" or "Marathon"), the matrix MUST consist of actual running assignments (e.g., "5km easy run", "8x400m sprints", "Tempo run"). 
Do NOT generate a generic gym strength routine. Use the 'sets' and 'reps' fields creatively for sport intervals (e.g. sets: 8, reps: "400m sprint") or set them to 1 / "Distance/Time" if it's a continuous effort (e.g., sets: 1, reps: "2 km").

SCHEMA: [{"day":"str","focus":"str","exercises":[{"name":"str","sets":0,"reps":"str","notes":"str","whyItMatters":"str"}]}]`;

    const response = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: "Generate 7-Day Athletic Matrix" }] }],
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const schedule = JSON.parse(response.text || "[]");
    
    // Persist Field Forge to DynamoDB
    if (bioData?.userId) {
      await saveWorkoutPlan(bioData.userId, {
        mode: "FIELD",
        directive: sport,
        schedule: schedule
      }).catch(console.error);
    }

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Sports Schedule API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate athletic matrix" }, { status: 500 });
  }
}
