const fs = require('fs');
let code = fs.readFileSync('app/api/ai/tts/route.ts', 'utf8');

code = code.replace(
  'if (trainerName === "Coach Tara") {',
  'if (trainerName && trainerName.toLowerCase().includes("tara")) {'
);

code = code.replace(
  'voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (Professional Female)',
  'voiceId = "EXAVITQu4vr4xnSDxMaL"; // Bella (Distinctly Female - Free Tier)'
);

fs.writeFileSync('app/api/ai/tts/route.ts', code);
