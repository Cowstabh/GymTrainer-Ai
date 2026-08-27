const { GoogleGenAI, Type } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Call the logFuelPayload function with meal "protein shake"',
      config: {
        tools: [{
          functionDeclarations: [
            {
              name: 'logFuelPayload',
              description: 'Triggers a simulated Phase 3 nutrition log with given details',
              parameters: {
                type: 'OBJECT', // or Type.OBJECT if Type exists, but string usually works or is 'object'
                properties: {
                  mealDescription: { type: 'STRING' } // or 'string'
                }
              }
            }
          ]
        }]
      }
    });
    console.log('Tools test response:', res.functionCalls);
  } catch (e) {
    console.error('Tools test failed:', e.message);
  }
}
run();
