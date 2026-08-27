const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Say "Live API Test OK"',
    });
    console.log('API Test Success:', res.text);
  } catch (e) {
    console.error('API Test Failed:', e.message);
  }
}
run();
