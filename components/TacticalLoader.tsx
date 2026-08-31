"use client";

import { useState, useEffect } from "react";

const LOADING_STEPS = [
  { time: 0, text: "> Establishing secure uplink..." },
  { time: 2000, text: "> Parsing biological telemetry..." },
  { time: 4500, text: "> Calculating progressive overload vectors..." },
  { time: 7000, text: "> Finalizing kinetic execution matrix..." },
  { time: 9000, text: "> Matrix complete. Awaiting deployment..." },
];

export default function TacticalLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timeouts = LOADING_STEPS.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, step.time);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6 w-full max-w-lg mx-auto p-6 bg-black border border-emerald-500/30 rounded-xl relative overflow-hidden">
      {/* Background Radar/Pulse Effect */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-32 h-32 rounded-full border border-emerald-500 animate-ping absolute"></div>
        <div className="w-48 h-48 rounded-full border border-emerald-500/50 absolute opacity-50"></div>
        <div className="w-64 h-64 rounded-full border border-emerald-500/20 absolute opacity-20"></div>
      </div>

      {/* Spinner */}
      <div className="relative z-10 w-16 h-16 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
      
      {/* Terminal Text Display */}
      <div className="relative z-10 w-full text-left font-mono bg-slate-900/80 p-4 rounded-md border border-slate-800 h-24 flex flex-col justify-end overflow-hidden">
        <div className="space-y-1">
          {LOADING_STEPS.slice(0, currentStep + 1).map((step, i) => (
            <p
              key={i}
              className={`text-sm ${
                i === currentStep
                  ? "text-emerald-400 font-bold animate-pulse"
                  : "text-emerald-700"
              }`}
            >
              {step.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
