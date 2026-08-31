import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getWorkoutPlan, saveWorkoutPlan, getKineticHistory } from "@/lib/dynamodb";
import crypto from "crypto";

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
  throw new Error("All backup models exhausted. " + (lastError?.message || ""));
}

export async function POST(req: Request) {
  try {
    const { userId, bioData, telemetry, nutrition, recalibrationPrompt } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // 1. CACHING LOGIC
    let currentHash = "";
    if (!recalibrationPrompt) {
      const hashPayload = JSON.stringify({ bioData, telemetry, nutrition });
      currentHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

      const pastPlanDoc = await getWorkoutPlan(userId).catch(() => null);
      if (pastPlanDoc && pastPlanDoc.plan && pastPlanDoc.plan.requestHash === currentHash) {
        const ageHours = (Date.now() - new Date(pastPlanDoc.updatedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours < 12) {
          console.log(`CACHE HIT for user ${userId}. Age: ${ageHours.toFixed(2)}h`);
          return NextResponse.json({ plan: pastPlanDoc.plan });
        }
      }
    }

    const kineticHistoryData = await getKineticHistory(userId).catch(() => null);
    const kineticHistory = kineticHistoryData?.history || [];
    const pastPlan = await getWorkoutPlan(userId).catch(() => null);

    // 2. PROMPT MINIFICATION
    const prompt = `SYS_ARCH: TACTICAL_AI.
BIO:${JSON.stringify(bioData||{})} TELEM:${JSON.stringify(telemetry||{})} NUTR:${JSON.stringify(nutrition||{})}
KHIST:${JSON.stringify(kineticHistory)} PAST:${JSON.stringify(pastPlan?.plan||{})}
DAYS:${bioData?.daysPerWeek||3} ENV:"${bioData?.equipmentProfile||'Gym'}"

RULES:
1. Exactly ${bioData?.daysPerWeek||3} active days. Rest days empty.
2. Apply progressive overload via KHIST.
3. If Env='Bodyweight Only', calisthenics only.
${recalibrationPrompt ? `4. RECALIBRATION:"${recalibrationPrompt}". MODIFY ONLY REQUESTED ITEMS. PRESERVE REST EXACTLY.` : ''}

JSON_SCHEMA: {
"status":"APPROVED"|"REJECTED",
"preFlightIgnition":"Briefing or rejection reason.",
"tacticalExecutionMatrix": [{"day":"str","focus":"str","exercises":[{"name":"str","sets":0,"reps":"str","targetWeight":"str","notes":"str","progressiveOverloadLogic":"str"}],"intensity":"str","durationMinutes":0}]
}`;

    const response = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { temperature: 0.1, responseMimeType: "application/json" },
    });
    
    const aiResponse = JSON.parse(response.text || "{}");

    if (aiResponse.status === "APPROVED" && aiResponse.tacticalExecutionMatrix) {
      aiResponse.requestHash = currentHash; // Embed hash for future cache hits
      await saveWorkoutPlan(userId, aiResponse).catch(console.error);
    } else if (aiResponse.status === "REJECTED") {
      return NextResponse.json({ error: aiResponse.preFlightIgnition, rejected: true }, { status: 400 });
    }

    return NextResponse.json({ plan: aiResponse });
  } catch (error: any) {
    console.error("Schedule Gen Error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
