"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, X, Send, Loader2, Mic, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";

type Message = {
  role: "user" | "model" | "system";
  content: string;
};

import { usePathname } from "next/navigation";

export default function AIChatbot() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trainerName, setTrainerName] = useState("Coach Kabir");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bioData");
      if (stored) {
        const parsed = JSON.parse(stored);
        const gender = parsed.trainerGender || "No Preference";
        if (gender === "Male") setTrainerName("Coach Vikram");
        else if (gender === "Female") setTrainerName("Coach Tara");
        else setTrainerName("Coach Kabir");
      }
    } catch(e) {}
  }, [isOpen, pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Text-to-Speech Engine (ElevenLabs Hyper-Realistic Audio)
  const speakMessage = async (text: string) => {
    if (isMuted) return;
    
    // Stop any currently playing audio before starting a new one
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    
    try {
      // Clean markdown asterisks from text
      const cleanText = text.replace(/[*#_]/g, '');

      const response = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, trainerName }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "TTS failed");
      }

      // Convert audio buffer to Blob and play it natively
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.play();
    } catch (error) {
      console.error("ElevenLabs Playback error:", error);
      // Fallback to native voice if ElevenLabs fails/runs out of credits
      if ('speechSynthesis' in window) {
         const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
         window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Speech-to-Text Engine
  const toggleListening = () => {
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
  };

  if (status !== "authenticated") {
    return null;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const localBio = localStorage.getItem("bioData");
      let bioData = null;
      if (localBio) {
        try { bioData = JSON.parse(localBio); } catch (e) {}
      }

      const telemetryData = localStorage.getItem("telemetryData");
      let telemetry = null;
      if (telemetryData) {
        try { telemetry = JSON.parse(telemetryData); } catch (e) {}
      }

      const userId = (session?.user as any)?.id || session?.user?.email || session?.user?.name || "user_123";

      const historyToSend = messages.filter(m => m.role === "user" || m.role === "model");
      
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: userMessage.content,
          history: historyToSend,
          bioData,
          telemetry,
          clientTime: new Date().toLocaleString()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const replyText = data.reply;
        setMessages((prev) => [...prev, { role: "model", content: replyText }]);
        speakMessage(replyText); // Voice Output
        
        if (data.toolsCalled?.includes("regenerateMatrix")) {
           setMessages((prev) => [...prev, { role: "system", content: "Tactical Matrix has been regenerated. Refresh or check dashboard." }]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "system", content: "Error: " + data.error }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "system", content: "Failed to connect to the tactical AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900 border border-emerald-500 rounded-lg shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <div className="bg-emerald-600 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold tracking-wider uppercase flex items-center gap-2">
              <MessageSquare size={18} />
              {trainerName}
            </h3>
            <div className="flex gap-3">
              <button onClick={() => {
                  const newMutedState = !isMuted;
                  setIsMuted(newMutedState);
                  if (newMutedState) {
                    window.speechSynthesis.cancel();
                    if (currentAudioRef.current) {
                      currentAudioRef.current.pause();
                    }
                  }
                }} 
                className="text-emerald-100 hover:text-white transition"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {messages.length === 0 && (
              <div className="text-slate-500 text-center mt-10 text-sm italic">
                System online. Audio protocols engaged. Waiting for input...
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30 rounded-br-none' 
                    : msg.role === 'model'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    : 'bg-emerald-900/50 text-emerald-200 border border-emerald-500/50 w-full text-center text-xs'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-emerald-400 p-3 rounded-lg rounded-bl-none border border-slate-700 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs tracking-wider uppercase">Processing</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <button 
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded transition-all ${isListening ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' : 'bg-slate-800 text-emerald-500 hover:bg-slate-700 border border-slate-700'}`}
                title="Voice Input"
              >
                <Mic size={18} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
