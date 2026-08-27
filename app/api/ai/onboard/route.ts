import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Ensure API key is set
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bioData, litmusTest } = body;

    const prompt = `
      You are an expert fitness coach analyzing a new user's profile and initial fitness test.
      
      User Bio-Data:
      - Age: ${bioData.age}
      - Gender: ${bioData.gender}
      - Height: ${bioData.height} cm
      - Weight: ${bioData.weight} kg
      - Goal: ${bioData.goal}
      - Timeframe: ${bioData.timeframe} weeks
      
      Litmus Test Results:
      - Pushups: ${litmusTest.pushups}
      - Squats: ${litmusTest.squats}
      - Plank: ${litmusTest.plank} seconds

      Based on this data, provide an encouraging but realistic 'Reality Check' assessment. 
      Limit your response to 2-3 paragraphs. Be highly motivating! ZERO EMOJIS.
      End your response with ONE specific question about their physical state or deployment.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return NextResponse.json({ assessment: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json({ error: "Failed to generate assessment" }, { status: 500 });
  }
}
