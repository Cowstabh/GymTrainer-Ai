import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getKineticHistory, saveKineticHistory } from "@/lib/dynamodb";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function POST(req: Request) {
  try {
    const { userId, sessionData } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const prompt = `SYSTEM ARCHITECTURE: CONTINUOUS ADAPTATION ENGINE - EXECUTION DEBRIEF.

You are an Elite Tactical AI Trainer. 
The user has completed a mission (workout) and is reporting their logged weights and failure points.
You must audit the biological damage incurred during this session, specifically focusing on micro-tears, CNS taxation, and lactic acid buildup.

User Session Data (Logged Weights and Failure Points): ${JSON.stringify(sessionData || {})}

Return a strict JSON object with the following schema. ZERO EMOJIS.
{
  "biologicalDamageAudit": {
    "microTears": "string (assessment of muscle fiber damage)",
    "cnsTaxation": "string (assessment of central nervous system fatigue)",
    "lacticAcid": "string (assessment of metabolic fatigue)"
  },
  "debriefMessage": "A tactical debrief message summarizing the audit and next steps for recovery. Must end with ONE specific question about their physical state or deployment."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const aiResponse = JSON.parse(response.text || "{}");

    // Fetch existing KineticHistory
    const existingHistoryData = await getKineticHistory(userId).catch(() => null);
    const existingHistory = existingHistoryData?.history || [];

    // Append this session's debrief to KineticHistory
    const newHistoryEntry = {
      timestamp: new Date().toISOString(),
      sessionData,
      audit: aiResponse.biologicalDamageAudit
    };

    const updatedHistory = [...existingHistory, newHistoryEntry];

    // Save back to DynamoDB
    await saveKineticHistory(userId, updatedHistory).catch(console.error);

    return NextResponse.json({ debrief: aiResponse });
  } catch (error) {
    console.error("Error generating execution debrief:", error);
    return NextResponse.json({ error: "Failed to generate execution debrief" }, { status: 500 });
  }
}
