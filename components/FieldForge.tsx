"use client";

import { useState, useEffect } from "react";
import { Loader2, Activity, Target, Clock, Trophy, X } from "lucide-react";
import toast from "react-hot-toast";
import TacticalLoader from "./TacticalLoader";

type LitmusTest = {
  testName: string;
  description: string;
  metricsToRecord: string;
};


// Global cache for SPA navigation during inflight generation
let globalLitmusPromise: Promise<any> | null = null;
let globalSchedulePromise: Promise<any> | null = null;
let cachedLitmusResult: any | null = null;
let cachedScheduleResult: any[] | null = null;
let isGeneratingLitmus = false;
let isGeneratingSchedule = false;

if (typeof window !== "undefined") {
  (window as any).getIsGeneratingField = () => isGeneratingLitmus || isGeneratingSchedule;
}


export default function FieldForge({ bioData, initialSchedule, initialSport, onGenerationStateChange }: { bioData: any, initialSchedule?: any, initialSport?: string, onGenerationStateChange?: (isGenerating: boolean) => void }) {
  const [selectedSportCategory, setSelectedSportCategory] = useState("Running");
  const [customSport, setCustomSport] = useState("");
  const [runningDistance, setRunningDistance] = useState("");
  const [bodybuildingFocus, setBodybuildingFocus] = useState("Full Body");
  
  const [sport, setSport] = useState(initialSport || ""); // Stores compiled string for UI
  const [timeframe, setTimeframe] = useState("");
  const [history, setHistory] = useState("");
  
  const [loadingLitmus, setLoadingLitmus] = useState(isGeneratingLitmus);
  const [litmusTest, setLitmusTest] = useState<LitmusTest | null>(cachedLitmusResult);
  
  const [litmusResult, setLitmusResult] = useState("");
  
  const [loadingSchedule, setLoadingSchedule] = useState(isGeneratingSchedule);
  const [schedule, setSchedule] = useState<any[] | null>(initialSchedule || cachedScheduleResult || null);



  useEffect(() => {
    let mounted = true;

    if (globalLitmusPromise) {
      globalLitmusPromise.then(data => {
        if (mounted) {
          setLitmusTest(data);
          setLoadingLitmus(false);
        }
      }).catch(() => {
        if (mounted) setLoadingLitmus(false);
      });
    }

    if (globalSchedulePromise) {
      globalSchedulePromise.then(data => {
        if (mounted) {
          setSchedule(data.schedule);
          setLoadingSchedule(false);
          setLitmusTest(null);
        }
      }).catch(() => {
        if (mounted) setLoadingSchedule(false);
      });
    }

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (globalLitmusPromise) {
      globalLitmusPromise.then(data => {
        if (mounted) {
          setLitmusTest(data);
          setLoadingLitmus(false);
        }
      }).catch(() => {
        if (mounted) setLoadingLitmus(false);
      });
    }

    if (globalSchedulePromise) {
      globalSchedulePromise.then(data => {
        if (mounted) {
          setSchedule(data.schedule);
          setLoadingSchedule(false);
          setLitmusTest(null);
        }
      }).catch(() => {
        if (mounted) setLoadingSchedule(false);
      });
    }

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (onGenerationStateChange) {
      onGenerationStateChange(loadingLitmus || loadingSchedule);
    }
  }, [loadingLitmus, loadingSchedule, onGenerationStateChange]);

  useEffect(() => {
    if (initialSchedule) setSchedule(initialSchedule);
    if (initialSport) {
      const parts = initialSport.split("| Timeframe:");
      const directiveStr = parts[0].replace("Active Athletic Directive: ", "").trim();
      setSport(directiveStr);
      
      if (directiveStr.startsWith("Running (Distance:")) {
        setSelectedSportCategory("Running");
        const dist = directiveStr.match(/Distance: (.*?)\)/)?.[1] || "";
        setRunningDistance(dist);
      } else if (directiveStr.startsWith("Bodybuilding (Focus:")) {
        setSelectedSportCategory("Bodybuilding");
        const focus = directiveStr.match(/Focus: (.*?)\)/)?.[1] || "";
        setBodybuildingFocus(focus);
      } else {
        const standardSports = ["Calisthenics", "Basketball", "Football / Soccer", "MMA / Combat Sports"];
        if (standardSports.includes(directiveStr)) {
          setSelectedSportCategory(directiveStr);
        } else {
          setSelectedSportCategory("Other");
          setCustomSport(directiveStr);
        }
      }

      if (parts[1]) setTimeframe(parts[1].trim());
    } else {
      const draftStr = localStorage.getItem("fieldForgeDraft");
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft.selectedSportCategory) setSelectedSportCategory(draft.selectedSportCategory);
          if (draft.customSport) setCustomSport(draft.customSport);
          if (draft.runningDistance) setRunningDistance(draft.runningDistance);
          if (draft.bodybuildingFocus) setBodybuildingFocus(draft.bodybuildingFocus);
          if (draft.timeframe) setTimeframe(draft.timeframe);
          if (draft.history) setHistory(draft.history);
        } catch (e) {}
      }
    }
  }, [initialSchedule, initialSport]);

  useEffect(() => {
    localStorage.setItem("fieldForgeDraft", JSON.stringify({
      selectedSportCategory, customSport, runningDistance, bodybuildingFocus, timeframe, history
    }));
  }, [selectedSportCategory, customSport, runningDistance, bodybuildingFocus, timeframe, history]);

  const handleGenerateLitmus = async (e: React.FormEvent) => {
    e.preventDefault();

    let compiledSport = selectedSportCategory;
    if (selectedSportCategory === "Running") {
      if (!runningDistance) { toast.error("Please enter a running distance."); return; }
      compiledSport = `Running (Distance: ${runningDistance})`;
    } else if (selectedSportCategory === "Bodybuilding") {
      compiledSport = `Bodybuilding (Focus: ${bodybuildingFocus})`;
    } else if (selectedSportCategory === "Other") {
      if (!customSport) { toast.error("Please specify your sport."); return; }
      compiledSport = customSport;
    }
    
    setSport(compiledSport);

    if (!compiledSport || !timeframe) {
      toast.error("Sport and timeframe are mandatory directives.");
      return;
    }
    
setLoadingLitmus(true);
    isGeneratingLitmus = true;
    
    globalLitmusPromise = fetch("/api/ai/sports-litmus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: compiledSport, bioData, timeframe, history })
    }).then(async res => {
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    });

    try {
      const data = await globalLitmusPromise;
      cachedLitmusResult = data;
      setLitmusTest(data);
    } catch (e) {
      toast.error("Failed to generate test.");
    } finally {
      globalLitmusPromise = null;
      isGeneratingLitmus = false;
      setLoadingLitmus(false);
    }
  }

  const handleGenerateSchedule = async () => {
setLoadingSchedule(true);
    isGeneratingSchedule = true;
    setSchedule(null);
    cachedScheduleResult = null;
    
    globalSchedulePromise = fetch("/api/ai/sports-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport, timeframe, history, litmusResult, bioData })
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    });

    try {
      const data = await globalSchedulePromise;
      cachedScheduleResult = data.schedule;
      setSchedule(data.schedule);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate athletic matrix.");
    } finally {
      globalSchedulePromise = null;
      isGeneratingSchedule = false;
      setLoadingSchedule(false);
      setLitmusTest(null);
      cachedLitmusResult = null;
    }
  }

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
        <button onClick={() => { setSchedule(null); cachedScheduleResult = null; }} className="text-slate-500 hover:text-white uppercase text-xs tracking-widest transition-colors">
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Target size={14} className="text-emerald-500" /> Target Sport / Event
            </label>
            <select
              value={selectedSportCategory}
              onChange={e => setSelectedSportCategory(e.target.value)}
              disabled={loadingLitmus}
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
              required
            >
              <option value="Running">Running</option>
              <option value="Bodybuilding">Bodybuilding</option>
              <option value="Calisthenics">Calisthenics</option>
              <option value="Basketball">Basketball</option>
              <option value="Football / Soccer">Football / Soccer</option>
              <option value="MMA / Combat Sports">MMA / Combat Sports</option>
              <option value="Other">Other (Specify)</option>
            </select>
          </div>

          {selectedSportCategory === "Running" && (
            <div className="space-y-2 pl-4 border-l-2 border-emerald-500/30">
              <label className="text-xs uppercase tracking-widest text-slate-400">Target Distance / Event Type</label>
              <input 
                type="text" 
                placeholder="e.g., 5K, 10K, Marathon, 400m Sprint"
                value={runningDistance}
                onChange={e => setRunningDistance(e.target.value)}
                disabled={loadingLitmus}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                required
              />
            </div>
          )}

          {selectedSportCategory === "Bodybuilding" && (
            <div className="space-y-2 pl-4 border-l-2 border-emerald-500/30">
              <label className="text-xs uppercase tracking-widest text-slate-400">Target Focus Area</label>
              <select
                value={bodybuildingFocus}
                onChange={e => setBodybuildingFocus(e.target.value)}
                disabled={loadingLitmus}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                required
              >
                <option value="Full Body">Full Body</option>
                <option value="Upper Body">Upper Body</option>
                <option value="Lower Body">Lower Body</option>
                <option value="Core">Core</option>
              </select>
            </div>
          )}

          {selectedSportCategory === "Other" && (
            <div className="space-y-2 pl-4 border-l-2 border-emerald-500/30">
              <label className="text-xs uppercase tracking-widest text-slate-400">Specify Sport</label>
              <input 
                type="text" 
                placeholder="e.g., Tennis, Swimming, Cycling"
                value={customSport}
                onChange={e => setCustomSport(e.target.value)}
                disabled={loadingLitmus}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                required
              />
            </div>
          )}
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
            disabled={loadingLitmus}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
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
            disabled={loadingLitmus}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors min-h-[100px] disabled:opacity-50"
          />
        </div>

        {loadingLitmus ? (
          <div className="mt-8">
            <TacticalLoader />
          </div>
        ) : (
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-3 text-xs rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2"
          >
            Generate Dynamic Litmus Test
          </button>
        )}
      </form>

      {/* Litmus Modal overlay */}
      {litmusTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-xl max-w-lg w-full p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="border-b border-slate-800 pb-4 mb-4 relative">
              <button 
                onClick={() => setLitmusTest(null)}
                disabled={loadingSchedule}
                className="absolute top-0 right-0 p-1 text-slate-500 hover:text-white transition-colors rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>
              <h3 className="text-xs text-emerald-500 uppercase tracking-widest font-bold mb-1">Baseline Calibration</h3>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider pr-8">{litmusTest.testName}</h2>
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
                  disabled={loadingSchedule}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {loadingSchedule ? (
                <div className="pt-4">
                  <TacticalLoader />
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex gap-3">
                    <button 
                      onClick={handleGenerateSchedule}
                      disabled={loadingSchedule}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider py-3 rounded transition-all text-xs disabled:opacity-50"
                    >
                      Skip Test & Generate
                    </button>
                    <button 
                      onClick={handleGenerateSchedule}
                      disabled={loadingSchedule || !litmusResult}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-3 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 text-xs flex justify-center items-center"
                    >
                      Submit & Generate Matrix
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic text-center leading-relaxed">
                    Note: This process may take a few moments. The AI is carefully analyzing your telemetry, bio-data, and specific goals to craft a highly personalized protocol.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
