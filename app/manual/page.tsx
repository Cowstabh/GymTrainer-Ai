import React from 'react';
import Link from 'next/link';
import { BookOpen, Dumbbell, Target, Flame, Mic, Shield, ChevronLeft } from 'lucide-react';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-black text-slate-300 selection:bg-emerald-500/30 font-sans pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold tracking-wider text-sm uppercase">Back to Command Center</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <BookOpen className="w-5 h-5" />
            <span className="font-black tracking-widest uppercase text-sm">Operator Manual</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 mt-12 space-y-16">
        
        {/* Title Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
            The <span className="text-emerald-500">Forge</span>
          </h1>
          <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
            Tactical Field Manual: How to extract maximum biological value from your AI-optimized training suite.
          </p>
        </section>

        {/* Section 1: Iron Forge */}
        <section className="space-y-6 relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-800 hidden md:block"></div>
          <div className="absolute -left-[51px] top-1 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full hidden md:flex items-center justify-center">
            <Dumbbell className="w-3 h-3 text-slate-400" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-white uppercase tracking-wide flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-emerald-500 md:hidden" />
            Iron Forge (Gym Protocol)
          </h2>
          <p className="text-lg leading-relaxed text-slate-400">
            The Iron Forge is designed for absolute hypertrophy and strength conditioning. It operates in continuous tactical phases to ensure you never hit a biological plateau.
          </p>
          
          <div className="grid gap-4 mt-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-emerald-400 font-bold uppercase tracking-wider mb-2">Phase 1: Generation</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                The AI analyzes your physical profile (BioData) and automatically generates a highly structured workout matrix. Every weight, set, and rep is calculated for progressive overload.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-emerald-400 font-bold uppercase tracking-wider mb-2">Phase 2: Execution Debrief</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                After a workout, report back to the AI. Tell it if a muscle is strained, if the weight was too light, or if you skipped a day. The AI will instantly **recalibrate** tomorrow's matrix to adapt to your exact physiological state.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-orange-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Phase 3: Fuel Logging
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Training without fuel is sabotage. Snap a photo of your meal ("Fuel Payload") and upload it. The Multimodal Vision AI will analyze the biological math (macros) and explain how it repairs the specific muscles you damaged today.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Field Forge */}
        <section className="space-y-6 relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-800 hidden md:block"></div>
          <div className="absolute -left-[51px] top-1 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full hidden md:flex items-center justify-center">
            <Target className="w-3 h-3 text-slate-400" />
          </div>

          <h2 className="text-3xl font-extrabold text-white uppercase tracking-wide flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-500 md:hidden" />
            Field Forge (Athletic Sports)
          </h2>
          <p className="text-lg leading-relaxed text-slate-400">
            For operatives specializing in external events (Marathons, 5K Runs, Football, Boxing). The Field Forge shifts the AI's objective from lifting heavy metal to athletic periodization.
          </p>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl mt-4">
            <h3 className="text-emerald-400 font-bold uppercase tracking-wider mb-2">The Litmus Test</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              You cannot plot a trajectory without a starting coordinate. When you initialize Field Forge, the AI will generate a highly specific "Litmus Test" (e.g., run 1km at 85% effort). Provide the results, and the AI will construct a 7-day tactical matrix perfectly dialed into your exact cardiovascular baseline.
            </p>
          </div>
        </section>

        {/* Section 3: AI Voice Coach */}
        <section className="space-y-6 relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-800 hidden md:block"></div>
          <div className="absolute -left-[51px] top-1 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full hidden md:flex items-center justify-center">
            <Mic className="w-3 h-3 text-slate-400" />
          </div>

          <h2 className="text-3xl font-extrabold text-white uppercase tracking-wide flex items-center gap-3">
            <Mic className="w-8 h-8 text-emerald-500 md:hidden" />
            Coach Tara (Voice AI)
          </h2>
          <p className="text-lg leading-relaxed text-slate-400">
            Powered by hyper-realistic neural voice synthesis, Coach Tara is your constant tactical overseer. 
          </p>

          <ul className="space-y-3 mt-4 text-slate-300">
            <li className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Click the green microphone in the bottom right corner of the dashboard to open the comms channel.</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Ask questions about form, biology, or modifications to your schedule.</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>The mic remains continuously hot—it will listen until you explicitly tap the red square to cut the feed.</span>
            </li>
          </ul>
        </section>
        
      </main>
    </div>
  );
}
