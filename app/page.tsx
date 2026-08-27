import Link from 'next/link';
import { Dumbbell, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50 p-6 selection:bg-emerald-500/30">
      <div className="flex flex-col items-center space-y-8 text-center max-w-3xl">
        {/* Icon */}
        <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <Dumbbell className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
        </div>
        
        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            AI Gym <span className="text-emerald-400">Trainer</span>
          </h1>
          <p className="text-lg text-slate-400 sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Your personal virtual spotter. Adaptive scheduling, biomechanical form analysis, and real-time feedback powered by Gemini 1.5 Pro.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/onboarding"
            className="group flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-lg font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="/dashboard"
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 px-8 py-4 text-lg font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
