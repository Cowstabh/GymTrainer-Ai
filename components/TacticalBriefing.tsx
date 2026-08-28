"use client";

import { useState, useEffect } from "react";
import { Activity, Video, Camera, Mic, ChevronRight, ChevronLeft, Check, ShieldAlert } from "lucide-react";

export default function TacticalBriefing() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeen = localStorage.getItem("hasSeenTutorial");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  if (!mounted || !isOpen) return null;

  const slides = [
    {
      icon: <Activity className="w-16 h-16 text-emerald-500 mb-4" />,
      title: "The Kinetic Matrix",
      description: "The Forge generates a 4-day tactical workout matrix customized to your exact body and environment. If your schedule changes, tell the AI exactly what to swap out without losing your progress."
    },
    {
      icon: <Video className="w-16 h-16 text-emerald-500 mb-4" />,
      title: "AI Form Analysis",
      description: "Record yourself executing an exercise. Upload the video, and the AI will analyze your biomechanics frame-by-frame to correct your posture and prevent injury."
    },
    {
      icon: <Camera className="w-16 h-16 text-emerald-500 mb-4" />,
      title: "Fuel Logging",
      description: "Snap a picture of your food payload. The AI will instantly calculate your macros (Protein, Carbs, Fats) and tell you exactly how it helps the muscles you trained today."
    },
    {
      icon: <Mic className="w-16 h-16 text-emerald-500 mb-4" />,
      title: "Tactical Voice Coach",
      description: "Click the chat icon anytime. You can speak directly to your coach. The coach tracks exactly when you train, so ask it if you are fully recovered before your next session."
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-xl max-w-lg w-full p-8 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-2">
          <ShieldAlert className="w-6 h-6 text-emerald-500/50 mx-auto" />
        </div>
        <h2 className="text-xs tracking-[0.3em] text-emerald-500 font-bold uppercase mb-8">
          Initial Briefing
        </h2>

        {/* Slide Content */}
        <div className="flex flex-col items-center justify-center min-h-[250px] transition-all duration-300">
          {slides[currentSlide].icon}
          <h3 className="text-2xl font-bold text-white mb-4 tracking-wider uppercase">
            {slides[currentSlide].title}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2 my-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'w-2 bg-slate-700'}`} 
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex w-full justify-between items-center mt-auto">
          <button 
            onClick={handleComplete}
            className="text-xs text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
          >
            Skip
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            {currentSlide < slides.length - 1 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full transition-all tracking-wider text-sm font-bold uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full transition-all tracking-wider text-sm font-bold uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                Complete <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
