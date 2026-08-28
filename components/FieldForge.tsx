"use client";

import { useState } from "react";
import { Loader2, Activity, Target, Clock, Trophy } from "lucide-react";
import toast from "react-hot-toast";

type LitmusTest = {
  testName: string;
  description: string;
  metricsToRecord: string;
};

export default function FieldForge({ bioData }: { bioData: any }) {
  const [sport, setSport] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [history, setHistory] = useState("");
  
  const [loadingLitmus, setLoadingLitmus] = useState(false);
  const [litmusTest, setLitmusTest] = useState<LitmusTest | null>(null);
  
  const [litmusResult, setLitmusResult] = useState("");
  
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [schedule, setSchedule] = useState<any[] | null>(null);

  const handleGenerateLitmus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport || !timeframe) {
      toast.error("Sport and timeframe are mandatory directives.");
      return;
    }
    
    setLoadingLitmus(true);
    try {
      const res = await fetch("/api/ai/sports-litmus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, timeframe, history })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLitmusTest(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate litmus test.");
    } finally {
      setLoadingLitmus(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setLoadingSchedule(true);
    setSchedule(null);
    try {
      const res = await fetch("/api/ai/sports-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, timeframe, history, litmusResult, bioData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchedule(data.schedule);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate athletic matrix.");
    } finally {
      setLoadingSchedule(false);
      setLitmusTest(null); // Close modal
    }
  };

  if (schedule) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-900 border-l-4 border-emerald-500 p-6 rounded-r-lg shadow-lg">
          <h2 className="text-xl font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-2">
            <Trophy size={20} /> Active Athletic Directive: {sport}
          </h2>
          <p className="text-slate-400 text-sm">Target Timeframe: {timeframe} | Litmus Logged: {litmusResult || "Skipped"}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {schedule.map((day: any, idx: number) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <h3 className="text-xl font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">
                {day.day} <span className="text-emerald-500 text-sm block mt-1 tracking-normal font-normal">Focus: {day.focus}</span>
              </h3>
              <div className="space-y-4">
                {day.exercises.map((ex: any, exIdx: number) => (
                  <div key={exIdx} className="bg-slate-950 p-4 rounded border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-emerald-400">{ex.name}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                        {ex.sets} x {ex.reps}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 italic mb-2">"{ex.notes}"</p>
                    <p className="text-xs text-slate-500 border-t border-slate-800 pt-2"><span className="text-emerald-500/70">Why:</span> {ex.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setSchedule(null)} className="text-slate-500 hover:text-white uppercase text-xs tracking-widest transition-colors">
          Abort Matrix & Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-widest text-emerald-500">Field Forge</h2>
        <p className="text-slate-400 text-sm">Initialize Athletic Specialization Protocols</p>
      </div>

      <form onSubmit={handleGenerateLitmus} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Target size={14} className="text-emerald-500" /> Target Sport / Event
          </label>
          <input 
            type="text" 
            placeholder="e.g., 5K Marathon, Football, MMA"
            value={sport}
            onChange={e => setSport(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" /> Timeframe
          </label>
          <input 
            type="text" 
            placeholder="e.g., 2 Months, 8 Weeks, October 30th"
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" /> Current Athletic History (Optional)
          </label>
          <textarea 
            placeholder="e.g., Running 10 miles a week, played soccer in high school."
            value={history}
            onChange={e => setHistory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors min-h-[100px]"
          />
        </div>

        <button 
          type="submit" 
          disabled={loadingLitmus}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-4 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loadingLitmus ? <><Loader2 size={18} className="animate-spin"/> Generating Litmus...</> : "Generate Dynamic Litmus Test"}
        </button>
      </form>

      {/* Litmus Modal overlay */}
      {litmusTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-xl max-w-lg w-full p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-xs text-emerald-500 uppercase tracking-widest font-bold mb-1">Baseline Calibration</h3>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">{litmusTest.testName}</h2>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {litmusTest.description}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-400">
                  Input Results: {litmusTest.metricsToRecord}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., 4:30 min, 160 BPM"
                  value={litmusResult}
                  onChange={e => setLitmusResult(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleGenerateSchedule}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider py-3 rounded transition-all text-xs"
                >
                  Skip Test & Generate
                </button>
                <button 
                  onClick={handleGenerateSchedule}
                  disabled={loadingSchedule || !litmusResult}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-3 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 text-xs flex justify-center items-center"
                >
                  {loadingSchedule ? <Loader2 size={16} className="animate-spin" /> : "Submit & Generate Matrix"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
