import Link from 'next/link';
import { Dumbbell, ArrowRight, Shield, Zap, Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-slate-50 overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600 via-slate-900 to-transparent pointer-events-none blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-10 text-center max-w-5xl px-6 w-full">
        
        {/* Icon & Eyebrow */}
        <div className="flex flex-col items-center gap-5 mt-10">
          <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] backdrop-blur-sm">
            <Dumbbell className="w-14 h-14 text-emerald-400" strokeWidth={1.5} />
          </div>
          <span className="text-emerald-500 font-mono text-sm tracking-[0.3em] uppercase font-bold">
            The Forge Platform
          </span>
        </div>
        
        {/* Hero Text */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase text-white drop-shadow-2xl">
            Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">AI Coach</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Your elite virtual spotter. Adaptive scheduling, biomechanical form analysis, and real-time progressive overload matrices designed for peak performance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Link 
            href="/onboarding"
            className="group flex items-center justify-center gap-3 rounded-lg bg-emerald-500 px-10 py-5 text-lg font-black uppercase tracking-wider text-black transition-all hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] focus:outline-none"
          >
            Initiate Protocol
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" strokeWidth={3} />
          </Link>
          <Link 
            href="/dashboard"
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 backdrop-blur-md px-10 py-5 text-lg font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-500"
          >
            Command Center
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-16 pb-8 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl border-t border-slate-800/80 mt-12">
          <div className="flex flex-col items-center gap-3 text-slate-400 p-4 rounded-xl hover:bg-slate-900/50 transition-colors">
            <Zap className="w-8 h-8 text-emerald-500 mb-2" strokeWidth={1.5} />
            <span className="font-bold text-white tracking-widest uppercase text-sm">Adaptive Matrices</span>
            <span className="text-sm text-center">Dynamic daily schedule adjustments</span>
          </div>
          <div className="flex flex-col items-center gap-3 text-slate-400 p-4 rounded-xl hover:bg-slate-900/50 transition-colors">
            <Activity className="w-8 h-8 text-emerald-500 mb-2" strokeWidth={1.5} />
            <span className="font-bold text-white tracking-widest uppercase text-sm">Bio-Telemetry</span>
            <span className="text-sm text-center">Real-time progressive overload tracking</span>
          </div>
          <div className="flex flex-col items-center gap-3 text-slate-400 p-4 rounded-xl hover:bg-slate-900/50 transition-colors">
            <Shield className="w-8 h-8 text-emerald-500 mb-2" strokeWidth={1.5} />
            <span className="font-bold text-white tracking-widest uppercase text-sm">Form Overrides</span>
            <span className="text-sm text-center">Kinetic AI-powered safety checks</span>
          </div>
        </div>
      </div>
    </main>
  );
}
