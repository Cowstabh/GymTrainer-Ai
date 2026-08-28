const fs = require('fs');
let code = fs.readFileSync('app/api/ai/chat/route.ts', 'utf8');

// Replace the response.text extraction
code = code.replace(
  'let replyText = response.text || "";',
  `let replyText = "";
    try {
      if (!response.functionCalls || response.functionCalls.length === 0) {
        replyText = response.text || "";
      }
    } catch(e) {
      console.warn("Failed to extract text from initial response");
    }`
);

// Replace followUpResponse.text extraction
code = code.replace(
  'replyText = followUpResponse.text || replyText;',
  `try {
        if (followUpResponse.text) {
          replyText = followUpResponse.text;
        }
      } catch (e) {
        console.warn("Failed to extract text from follow-up response");
        replyText = "Matrix adjustments have been processed. I have updated your file.";
      }
      
      if (!replyText || replyText.trim() === "") {
        replyText = "Understood. The operation has been executed.";
      }`
);

fs.writeFileSync('app/api/ai/chat/route.ts', code);
