import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

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
    const { sport, timeframe, history } = await req.json();

    const systemPrompt = `You are an elite tactical sports coach. The operative is training for: ${sport}. 
Timeframe: ${timeframe}.
Athletic History: ${history}.

Generate a single, highly specific, safe baseline "Litmus Test" they can perform today to gauge their current level.
For example, if they are training for a 5K, ask them to run 1km at 85% effort. If they are training for football, suggest the Yo-Yo test or a 400m sprint.
Return ONLY valid JSON matching this schema: { "testName": "string", "description": "string", "metricsToRecord": "string" }`;

    const response = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: "Generate Litmus Test" }] }],
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Litmus API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate test" }, { status: 500 });
  }
}
