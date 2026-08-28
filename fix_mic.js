const fs = require('fs');
let code = fs.readFileSync('components/AIChatbot.tsx', 'utf8');

// 1. Add recognitionRef
code = code.replace(
  'const messagesEndRef = useRef<HTMLDivElement>(null);',
  'const messagesEndRef = useRef<HTMLDivElement>(null);\n  const recognitionRef = useRef<any>(null);'
);

// 2. Replace toggleListening
const oldToggle = `  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tactical voice systems not supported in this browser.");
      return;
    }

    if (isListening) return; // Allow natural stop

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Mic active. Speak now.");
    };

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };`;

const newToggle = `  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tactical voice systems not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    // continuous=true keeps the mic open until explicitly stopped
    recognition.continuous = true;
    // interimResults=true shows text as the user is speaking
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Mic active. Tap again to stop.");
    };

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };`;

code = code.replace(oldToggle, newToggle);

fs.writeFileSync('components/AIChatbot.tsx', code);
