import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getKineticHistory, saveKineticHistory } from "@/lib/dynamodb";

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
    const { userId, message, history, bioData, telemetry, clientTime } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const trainerGender = bioData?.trainerGender || "No Preference";
    
    let trainerName = "Coach Kabir";
    if (trainerGender === "Male") trainerName = "Coach Vikram";
    if (trainerGender === "Female") trainerName = "Coach Tara";

    // Fetch KineticHistory so the Chatbot knows past timestamps
    const kineticHistoryData = await getKineticHistory(userId).catch(() => null);
    const kineticHistory = kineticHistoryData?.history || [];

    const systemPrompt = `You are ${trainerName}, an elite Indian tactical AI fitness coach. 
Your tone MUST be highly compassionate yet strictly disciplined. You care deeply about the user's well-being but absolutely demand their maximum effort and consistency. You speak with authority, wisdom, and encouragement.
The user selected a trainer gender of '${trainerGender}', which dictates your persona.

CRITICAL TEMPORAL AWARENESS:
The user's current live time is: ${clientTime || new Date().toLocaleString()}
Use this timestamp to calculate recovery windows against their Kinetic History. If they finished a grueling workout recently, strictly advise rest.

You have tools available:
- logFuelPayload: Triggers a simulated Phase 3 nutrition log.
- logExecutionDebrief: Appends an injury or workout debrief directly to the user's KineticHistory in DynamoDB.
- regenerateMatrix: Triggers the /api/ai/schedule generation logic (can accept a recalibrationPrompt if the user wants to change their matrix).

If a tool is called, you will receive its output and you must respond to the user based on that output. Maintain your ${trainerName} persona at all times.
User Profile: ${JSON.stringify(bioData || {})}
Telemetry: ${JSON.stringify(telemetry || {})}
Kinetic History (Past Debriefs): ${JSON.stringify(kineticHistory)}
`;

    // Map history to the required format
    let contents = [];
    if (history && history.length > 0) {
      contents = history.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
    }
    
    // Add the new message
    contents.push({ role: "user", parts: [{ text: message }] });

    const tools: any = [{
      functionDeclarations: [
        {
          name: "logFuelPayload",
          description: "Triggers a simulated Phase 3 nutrition log.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              mealDescription: { type: Type.STRING, description: "The details of the meal" }
            },
            required: ["mealDescription"]
          }
        },
        {
          name: "logExecutionDebrief",
          description: "Appends an injury or workout debrief directly to the user's KineticHistory in DynamoDB.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              debriefText: { type: Type.STRING, description: "The details of the workout or injury to log." }
            },
            required: ["debriefText"]
          }
        },
        {
          name: "regenerateMatrix",
          description: "Triggers the schedule generation logic.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              recalibrationPrompt: { type: Type.STRING, description: "Optional instructions on what specifically needs to change in the matrix." }
            }
          }
        }
      ]
    }];

    const response = await generateWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        tools: tools,
        temperature: 0.3,
      }
    });

    let replyText = response.text || "";
    let toolsCalled: string[] = [];

    // If function calls are requested
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionResponses = [];

      for (const call of response.functionCalls) {
        toolsCalled.push(call.name || "");
        
        let toolResponseContent = "";

        if (call.name === "logFuelPayload") {
          const args = call.args as any;
          const mealDescription = args?.mealDescription;
          toolResponseContent = `Successfully simulated Phase 3 nutrition log for: ${mealDescription}`;
        } else if (call.name === "logExecutionDebrief") {
          const args = call.args as any;
          const debriefText = args?.debriefText;
          const pastHistoryData = await getKineticHistory(userId).catch(() => null);
          const pastHistory = pastHistoryData?.history || [];
          
          pastHistory.push({
            date: new Date().toISOString(),
            type: "debrief",
            notes: debriefText
          });
          
          await saveKineticHistory(userId, pastHistory);
          toolResponseContent = `Successfully appended debrief to KineticHistory in DynamoDB.`;
        } else if (call.name === "regenerateMatrix") {
          const args = call.args as any;
          const protocol = req.headers.get("x-forwarded-proto") || "http";
          const host = req.headers.get("host") || "localhost:3000";
          
          try {
            const schedRes = await fetch(`${protocol}://${host}/api/ai/schedule`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, bioData, telemetry, recalibrationPrompt: args.recalibrationPrompt })
            });
            const schedData = await schedRes.json();
            if (schedRes.ok && schedData.plan) {
               toolResponseContent = `Successfully regenerated Matrix. Instruct the user to check their dashboard.`;
            } else {
               toolResponseContent = `Failed to regenerate Matrix. Reason: ${schedData.error || "Unknown"}`;
            }
          } catch(e: any) {
             toolResponseContent = `Failed to regenerate Matrix due to network error.`;
          }
        }

        functionResponses.push({
          name: call.name,
          response: { result: toolResponseContent }
        });
      }

      // Make a second call to Gemini with the function responses
      const followUpContents = [...contents, {
        role: "model",
        parts: response.functionCalls.map((call: any) => ({ functionCall: call }))
      }, {
        role: "user",
        parts: functionResponses.map(resp => ({ functionResponse: resp }))
      }];

      const followUpResponse = await generateWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: followUpContents,
        config: {
          systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
          tools: tools,
          temperature: 0.3,
        }
      });
      
      replyText = followUpResponse.text || replyText;
    }

    return NextResponse.json({ reply: replyText, toolsCalled });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
