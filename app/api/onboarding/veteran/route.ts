import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { saveKineticHistory, getKineticHistory } from "@/lib/dynamodb";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bioData, baselineData } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Parse the rawText using Gemini
    const rawText = baselineData.rawText || "No data provided.";
    const prompt = `You are an elite data extraction AI.
The user has provided a raw text 'Situation Report' describing their current workout routine and injuries.
Extract this into a strict JSON format. ZERO EMOJIS.
Format:
{
  "exercises": [
    { "name": "string", "sets": "string", "reps": "string", "weight": "string" }
  ],
  "injuries": "string (summarize any injuries mentioned, or leave blank if none)"
}

User Text: "${rawText}"`;

    let extractedData = { exercises: [], injuries: "" };
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      extractedData = JSON.parse(response.text || "{}");
    } catch (aiError) {
      console.error("AI Parsing failed:", aiError);
    }

    const session0 = {
      sessionId: "0",
      date: new Date().toISOString(),
      type: "Baseline",
      exercises: extractedData.exercises || [],
      injuries: extractedData.injuries || "",
      bioData: bioData
    };

    let existingHistory = null;
    try {
      existingHistory = await getKineticHistory(userId);
    } catch (e) {
      console.warn("Could not fetch existing history, starting fresh.", e);
    }
    const historyArray = existingHistory?.history || [];
    
    // Add or replace session 0
    const existingIndex = historyArray.findIndex((s: any) => s.sessionId === "0");
    if (existingIndex >= 0) {
      historyArray[existingIndex] = session0;
    } else {
      historyArray.unshift(session0);
    }

    await saveKineticHistory(userId, historyArray);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving veteran baseline:", error);
    return NextResponse.json({ error: "Failed to save baseline" }, { status: 500 });
  }
}
