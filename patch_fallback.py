import re
import sys

def apply_fallback_logic(filepath):
    with open(filepath, 'r') as f:
        code = f.read()

    # We need to replace single model calls with a fallback loop.
    # Pattern to find: 
    # const response = await ai.models.generateContent({
    #   model: "gemini-3.6-flash",
    #   contents: contents,
    #   config: { ... }
    # });

    # Because replacing AST with regex is fragile, let's inject a helper function at the top,
    # and then replace ai.models.generateContent with generateWithFallback.

    helper = """
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
"""

    if "generateWithFallback" not in code:
        code = code.replace('export async function POST', helper + '\nexport async function POST')
        
    code = code.replace('await ai.models.generateContent(', 'await generateWithFallback(ai, ')
    
    with open(filepath, 'w') as f:
        f.write(code)

apply_fallback_logic("app/api/ai/chat/route.ts")
apply_fallback_logic("app/api/ai/schedule/route.ts")
try:
    apply_fallback_logic("app/api/ai/analyze-form/route.ts")
except:
    pass
try:
    apply_fallback_logic("app/api/ai/nutrition/route.ts")
except:
    pass

print("Successfully applied AI model fallbacks.")
