import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getWorkoutPlan, saveWorkoutPlan, getKineticHistory } from "@/lib/dynamodb";

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
    const { userId, bioData, telemetry, nutrition, recalibrationPrompt } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch past KineticHistory if any
    const kineticHistoryData = await getKineticHistory(userId).catch(() => null);
    const kineticHistory = kineticHistoryData?.history || [];
    const pastPlan = await getWorkoutPlan(userId).catch(() => null);

    const prompt = `SYSTEM ARCHITECTURE: CONTINUOUS ADAPTATION ENGINE.
    
You are an Elite Tactical AI Trainer. 
Your objective is to evaluate the provided bioData, telemetry, nutrition payload, and KineticHistory.
You must calculate progressive overload based on historical debriefs from KineticHistory (e.g., Weight X for Y+2 reps, or Weight X+5 for Y-2 reps).

CRITICAL CONSTRAINT: The user's Bio-Data specifies a workout frequency of ${bioData?.daysPerWeek || 3} days per week. You MUST schedule EXACTLY ${bioData?.daysPerWeek || 3} active kinetic strike (workout) days within the 7-day matrix. The remaining days MUST be explicit system shutdown/recovery days (with an empty exercises array).
ENVIRONMENT & EQUIPMENT OVERRIDE: The user's operational environment is "${bioData?.equipmentProfile || 'Full Gym Facility'}". If the profile is 'Bodyweight Only', you MUST NOT prescribe bench presses, dumbbells, cables, or machines; prescribe ONLY calisthenics, plyometrics, and leverage movements. If 'Home Forge', assume basic dumbbells/kettlebells but no massive machines.

${recalibrationPrompt ? `RECALIBRATION DIRECTIVE (STRICT GUARDRAIL): The user specifically requested the following edit to their current matrix: "${recalibrationPrompt}". You MUST preserve the rest of the 'Past Plan' matrix EXACTLY as it was, modifying ONLY the specific components requested. DO NOT hallucinate a completely new schedule. DO NOT rewrite everything. Apply surgical precision.` : ''}

User Payload:
Bio-Data: ${JSON.stringify(bioData || {})}
Telemetry: ${JSON.stringify(telemetry || {})}
Nutrition: ${JSON.stringify(nutrition || {})}
Kinetic History: ${JSON.stringify(kineticHistory)}
Past Plan: ${JSON.stringify(pastPlan?.plan || {})}

Return a strict JSON object with the following schema. ZERO EMOJIS.
{
  "status": "APPROVED" | "REJECTED",
  "preFlightIgnition": "A tactical directive explaining the refusal (if rejected) or mission briefing (if approved). This is a strict command reminding the user of their exact injury constraints and fueling protocols before they execute the matrix. DO NOT ask a question here.",
  "tacticalExecutionMatrix": [
    // If APPROVED, provide a 7-day schedule array:
    {
      "day": "string",
      "focus": "string",
      "exercises": [ { "name": "string", "sets": "number", "reps": "string", "targetWeight": "string", "notes": "string", "progressiveOverloadLogic": "string" } ],
      "intensity": "string",
      "durationMinutes": "number"
    }
  ]
}
`;

    const response = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });
    
    const aiResponse = JSON.parse(response.text || "{}");

    // Persist to DynamoDB only if a schedule was generated
    if (aiResponse.status === "APPROVED" && aiResponse.tacticalExecutionMatrix) {
      await saveWorkoutPlan(userId, aiResponse).catch(console.error);
    } else if (aiResponse.status === "REJECTED") {
      return NextResponse.json({ error: aiResponse.preFlightIgnition, rejected: true }, { status: 400 });
    }

    return NextResponse.json({ plan: aiResponse });
  } catch (error: any) {
    console.error("Error generating schedule:", error);
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
