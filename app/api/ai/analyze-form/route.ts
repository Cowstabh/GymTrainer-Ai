import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });


const MODELS = ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

async function generateWithFallback(aiClient, payload) {
  let lastError = null;
  for (const model of MODELS) {
    try {
      return await aiClient.models.generateContent({ ...payload, model });
    } catch (error) {
      console.warn(`Model ${model} failed:`, error?.message || error);
      lastError = error;
    }
  }
  throw new Error("All backup AI models are exhausted or rate-limited. " + (lastError?.message || ""));
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    // 1. Download the video from S3 (using the signed URL) to a temp file
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from S3: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);
    await fs.writeFile(tempFilePath, buffer);

    // 2. Upload to Gemini File API
    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "video/mp4" },
    });

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(console.error);

    // 3. Prompt Gemini 1.5 Pro to analyze the video
    // Keep temperature low for strict, accurate biomechanical feedback.
    const prompt = `
      You are an expert biomechanics and fitness coach ("Virtual Spotter").
      Analyze this user's workout video for form and technique.
      Provide strict, punchy feedback on their biomechanics.
      
      Respond strictly in the following JSON format without any markdown wrappers or extra text:
      {
        "status": "correct" | "incorrect",
        "correction": "Punchy feedback here. (e.g., Your back is rounding. Keep your chest up.)",
        "details": "A slightly longer explanation of why this matters. ZERO EMOJIS. Must end with ONE specific question about their physical state or deployment."
      }
    `;

    const generatedResult = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              fileData: {
                fileUri: uploadResult.uri,
                mimeType: uploadResult.mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.2, // Low temperature for consistent JSON
        responseMimeType: "application/json",
      },
    });

    // 4. Cleanup Gemini File API to not leak storage
    if (uploadResult.name) {
      await ai.files.delete({ name: uploadResult.name }).catch(console.error);
    }

    // 5. Parse and return JSON
    const textRes = generatedResult.text || "{}";
    const parsedData = JSON.parse(textRes);

    return NextResponse.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze video", details: error.message },
      { status: 500 }
    );
  }
}
