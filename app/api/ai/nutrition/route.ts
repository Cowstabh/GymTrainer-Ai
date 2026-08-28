import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });


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

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: "Missing imageUrl or imageBase64" }, { status: 400 });
    }

    let mimeType = "image/jpeg";
    let fileUri = null;
    let uploadName = null;
    let inlineData = null;

    if (imageBase64) {
      // If a base64 string is provided directly
      // Expecting format like "data:image/png;base64,iVBORw..." or just the raw base64
      let base64Data = imageBase64;
      if (imageBase64.includes("base64,")) {
        const parts = imageBase64.split("base64,");
        mimeType = parts[0].split(":")[1].split(";")[0];
        base64Data = parts[1];
      }
      inlineData = {
        data: base64Data,
        mimeType,
      };
    } else if (imageUrl) {
      // Download the image from S3 (using the signed URL) to a temp file
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // We'll just convert it to base64 directly in memory instead of File API if we want,
      // but to be safe with sizes we can use File API like the form analyzer.
      // Let's use the File API just in case.
      const tempFilePath = path.join(os.tmpdir(), `image-${Date.now()}.jpg`);
      await fs.writeFile(tempFilePath, buffer);

      // Upload to Gemini File API
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: "image/jpeg" },
      });

      fileUri = uploadResult.uri;
      uploadName = uploadResult.name;
      mimeType = uploadResult.mimeType || "image/jpeg";

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(console.error);
    }

    const prompt = `
      You are an elite tactical military fitness and nutrition coach.
      Analyze this user's meal ("fuel payload") from the provided image.
      Provide a strict, punchy, tactical breakdown of the biological math.
      Strictly categorize the food into: Structural Mortar (Protein), Glycogen Pre-load (Carbs), and Cellular Hydration.
      Explain how this fuel repairs the targeted muscle groups from the day's kinetic damage.
      ZERO EMOJIS.
      End your response with ONE specific question about their physical state or deployment.
      
      Respond strictly in the following JSON format matching this schema:
      {
        "macros": {
          "calories": "Estimated total calories",
          "protein": "Estimated grams of protein",
          "carbs": "Estimated grams of carbs",
          "fats": "Estimated grams of fats"
        },
        "tacticalAnalysis": "A brief, intense tactical breakdown of how this fuel repairs the targeted muscle groups. Must end with ONE specific question about their physical state or deployment. ZERO EMOJIS."
      }
    `;

    const parts: any[] = [{ text: prompt }];

    if (inlineData) {
      parts.push({
        inlineData: {
          data: inlineData.data,
          mimeType: inlineData.mimeType,
        },
      });
    } else if (fileUri) {
      parts.push({
        fileData: {
          fileUri,
          mimeType,
        },
      });
    }

    const generatedResult = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    if (uploadName) {
      // Cleanup Gemini File API to not leak storage
      await ai.files.delete({ name: uploadName }).catch(console.error);
    }

    const textRes = generatedResult.text || "{}";
    const parsedData = JSON.parse(textRes);

    return NextResponse.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.error("AI Nutrition Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze nutrition", details: error.message },
      { status: 500 }
    );
  }
}
