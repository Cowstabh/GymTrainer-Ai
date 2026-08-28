import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getSession } from "next-auth/react";

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

    const systemPrompt = `You are an elite tactical athletic conditioning coach.
The operative is specializing for a specific sport/event: ${sport}.
Target Timeframe: ${timeframe}.
Athletic History: ${history}.
Baseline Litmus Test Result: ${litmusResult || "Skipped / N/A"}.
Bio Data: ${JSON.stringify(bioData || {})}.

Your mission is to generate a highly periodized, customized 7-Day Athletic Training Block (Week 1).
It must be scientifically structured for their sport (e.g., runners need track intervals, long runs, recovery; footballers need agility, sprints, plyometrics).
Do not just output standard gym lifts unless they are explicitly prescribed as "Strength & Conditioning" support days.

Output ONLY a JSON array of day objects.
Each day must have a "day" (e.g. "Day 1: Speed Endurance"), "focus", and an array of "exercises".
For sports, an "exercise" can be a drill or running block (e.g., name: "400m Repeats", sets: 6, reps: "400m sprint, 90s rest", notes: "Target pace derived from Litmus", whyItMatters: "Explain why this exercise matters").`;

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
    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Sports Schedule API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate athletic matrix" }, { status: 500 });
  }
}
