"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "model" | "system";
  content: string;
};

export default function AIChatbot() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trainerName, setTrainerName] = useState("Coach Kabir");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (status !== "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          telemetry
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
        
        // If regenerateMatrix was called, we might want to refresh the page or tell the user
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
            <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white transition">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {messages.length === 0 && (
              <div className="text-slate-500 text-center mt-10 text-sm italic">
                System online. Waiting for input...
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
