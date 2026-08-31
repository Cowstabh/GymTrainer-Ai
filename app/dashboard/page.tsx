"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import VisualNutrition from "@/components/VisualNutrition";
import { Dumbbell, Utensils, Activity, PowerOff, Zap } from "lucide-react";
import TacticalBriefing from "@/components/TacticalBriefing";
import FieldForge from "@/components/FieldForge";
import TacticalLoader from "@/components/TacticalLoader";
import GymAmbience from "@/components/GymAmbience";
type Exercise = {
  name: string;
  sets: number;
  reps: string;

  notes: string;
  whyItMatters?: string;
  targetWeight?: string;
  progressiveOverloadLogic?: string;
};

type DaySchedule = {
  day: string;
  focus: string;
  exercises: Exercise[];
  intensity: string;
  durationMinutes: number;
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


// Global cache for SPA navigation during inflight Iron Forge generation
let globalIronPromise: Promise<any> | null = null;
let cachedIronResult: any = null;
let isGeneratingIron = false;

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [directive, setDirective] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDay, setStartDay] = useState<string>("Monday");
  const [generating, setGenerating] = useState(isGeneratingIron);
  const [hasBioData, setHasBioData] = useState(false);
  const [activePhase, setActivePhase] = useState<number>(1);
  const [forgeMode, setForgeModeState] = useState<"IRON" | "FIELD">("IRON");
  const [activePlanMode, setActivePlanMode] = useState<"IRON" | "FIELD" | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [recalibrationPrompt, setRecalibrationPrompt] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("forgeMode");
    if (saved === "IRON" || saved === "FIELD") setForgeModeState(saved);

    let mounted = true;
    if (globalIronPromise) {
      globalIronPromise.then(data => {
        if (mounted && data) {
          if (data.rejected) {
            toast.error(`TACTICAL OVERRIDE: ${data.error}`);
          } else if (data.plan) {
            setSchedule(data.plan.tacticalExecutionMatrix || data.plan.schedule || null);
            setDirective(data.plan.preFlightIgnition || data.plan.directive || null);
            setShowRecalibrate(false);
            setRecalibrationPrompt("");
            setActivePhase(2);
          }
          setGenerating(false); setLoading(false);
        }
      }).catch(() => {
        if (mounted) { setGenerating(false); setLoading(false); }
      });
    }

    return () => { mounted = false; };
  }, []);

  const setForgeMode = (mode: "IRON" | "FIELD") => {
    setForgeModeState(mode);
    localStorage.setItem("forgeMode", mode);
  };

  const fetchCurrentPlan = async () => {
    if (isGeneratingIron || (typeof window !== "undefined" && (window as any).getIsGeneratingField && (window as any).getIsGeneratingField())) { setLoading(false); return; } // Skip DB fetch if we have an active generation in flight
    setLoading(true);
    try {
      const res = await fetch("/api/workouts/current");
      if (res.ok) {
        const data = await res.json();
        const actualPlan = data.plan?.plan || data.plan;
        if (actualPlan) {
          setSchedule(actualPlan.tacticalExecutionMatrix || actualPlan.schedule || null);
          setDirective(actualPlan.preFlightIgnition || actualPlan.directive || null);
          setActivePlanMode(actualPlan.mode || "IRON");
          if (actualPlan.mode) {
            setForgeMode(actualPlan.mode);
          }
        } else {
          setSchedule(null);
          setDirective(null);
          setActivePlanMode(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!session?.user) return;
    setGenerating(true);
    try {
      const userId = session.user.email || session.user.name || "user_123";
      const localBio = localStorage.getItem("bioData");
      let parsedBioData = null;
      try {
        parsedBioData = localBio ? JSON.parse(localBio) : null;
      } catch (e) {}

      if (!parsedBioData || !parsedBioData.age || !parsedBioData.weight || parsedBioData.userId !== userId) {
        toast.error("Profile incomplete or data mismatch! Please provide your physical metrics for a safe routine.");
        window.location.href = "/onboarding";
        return;
      }

      const telemetryData = localStorage.getItem("telemetryData");
      let parsedTelemetry = null;
      try {
        parsedTelemetry = telemetryData ? JSON.parse(telemetryData) : null;
      } catch (e) {}

      isGeneratingIron = true;
      globalIronPromise = fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          bioData: parsedBioData,
          telemetry: parsedTelemetry,
          recalibrationPrompt: recalibrationPrompt || undefined
        }),
      }).then(async res => {
        const data = await res.json();
        return { ok: res.ok, ...data };
      });

      const data = await globalIronPromise;
      cachedIronResult = data;

      if (!data.ok && data.rejected) {
        toast.error(`TACTICAL OVERRIDE: ${data.error}`);
        return;
      }

      if (data.plan) {
        setSchedule(data.plan.tacticalExecutionMatrix || data.plan.schedule || null);
        setDirective(data.plan.preFlightIgnition || data.plan.directive || null);
        setShowRecalibrate(false);
        setRecalibrationPrompt("");
        // Automatically switch to the Execution Debrief tab to view the generated matrix
        setActivePhase(2);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate execution matrix");
    } finally {
      globalIronPromise = null;
      isGeneratingIron = false;
      setGenerating(false); setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }

    const initDashboard = async () => {
      if (!session?.user) return;
      
      const savedStartDay = localStorage.getItem("programStartDay");
      if (savedStartDay) {
        setStartDay(savedStartDay);
      }

      const bioData = localStorage.getItem("bioData");
      
      try {
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile && profileData.profile.age && profileData.profile.weight) {
            setHasBioData(true);
            // Cache it locally just for immediate component access during generation
            localStorage.setItem("bioData", JSON.stringify(profileData.profile));
          } else {
            setHasBioData(false);
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile from DB", e);
      }
      
      await fetchCurrentPlan();
    };

    if (session?.user) {
      initDashboard();
    }
  }, [session, status]);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6 md:p-12 font-sans selection:bg-neon-green selection:text-black">
      <TacticalBriefing />
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white uppercase">
              Command <span className="text-emerald-500">Center</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              {session?.user?.name ? `Welcome back, ${session.user.name}. ` : ""}Your AI-optimized tactical suite.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Link href="/manual" className="px-6 py-3 font-bold text-emerald-400 border border-emerald-500/30 rounded-md transition-all hover:bg-emerald-500/10">
              Field Manual
            </Link>

            <GymAmbience />
          </div>
        </header>

        {/* Forge Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex shadow-lg">
            <button
              onClick={() => setForgeMode("IRON")}
              disabled={generating}
              className={`px-8 py-3 rounded-md font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${forgeMode === "IRON" ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Iron Forge (Gym)
            </button>
            <button
              onClick={() => setForgeMode("FIELD")}
              disabled={generating}
              className={`px-8 py-3 rounded-md font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${forgeMode === "FIELD" ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Field Forge (Sports)
            </button>
          </div>
        </div>

        {forgeMode === "IRON" ? (
        <div className="w-full">


        {/* Phase Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 mt-8 mb-4 overflow-x-auto">
          <button
            onClick={() => setActivePhase(1)}
            className={`px-4 md:px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activePhase === 1 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            <Zap className="w-4 h-4 md:w-5 md:h-5" />
            PHASE 1: GENERATION
          </button>
          <button
            onClick={() => setActivePhase(2)}
            className={`px-4 md:px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activePhase === 2 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            <Dumbbell className="w-4 h-4 md:w-5 md:h-5" />
            PHASE 2: EXECUTION DEBRIEF
          </button>
          <button
            onClick={() => setActivePhase(3)}
            className={`px-4 md:px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activePhase === 3 
                ? "border-orange-500 text-orange-400" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            <Utensils className="w-4 h-4 md:w-5 md:h-5" />
            PHASE 3: FUEL LOGGING
          </button>
          <button
            onClick={() => setActivePhase(4)}
            className={`px-4 md:px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activePhase === 4 
                ? "border-red-500 text-red-400" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            <PowerOff className="w-4 h-4 md:w-5 md:h-5" />
            PHASE 4: SYSTEM SHUTDOWN
          </button>
        </div>

        {/* Phase Content */}
        <div className="pt-4">
          {/* Phase 1: Generation */}
          {activePhase === 1 && (
            loading || status === "loading" || generating ? (
              <TacticalLoader />
            ) : (
              <>
                {directive && (
                  <div className="mb-8 p-6 bg-slate-900 border-l-4 border-emerald-500 rounded-r-xl">
                    <h3 className="text-emerald-400 font-black uppercase tracking-widest mb-2 text-sm">Pre-Flight Ignition Directive</h3>
                    <p className="text-slate-300 font-mono text-sm">{directive}</p>
                  </div>
                )}
                
                <div className="text-center py-10">
                  <h2 className="text-2xl font-bold text-white mb-4">TACTICAL OVERVIEW</h2>
                  {schedule ? (
                    <p className="text-slate-400 mb-6 max-w-2xl mx-auto">Your matrix is currently active and deployed. If conditions have changed, recalibrate below.</p>
                  ) : (
                    <p className="text-slate-400 mb-6 max-w-2xl mx-auto">No active matrix found. Initiate generation sequence to deploy your tactical schedule.</p>
                  )}
                  
                  {hasBioData ? (
                    schedule && !showRecalibrate ? (
                      <button 
                        onClick={() => setShowRecalibrate(true)}
                        className="px-8 py-4 font-bold text-black bg-emerald-500 rounded-md transition-all hover:bg-emerald-400 uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        Regenerate Matrix
                      </button>
                    ) : (
                      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
                        {schedule && (
                          <div className="w-full mb-4 text-left">
                            <label className="block text-sm font-medium text-emerald-400 mb-2 uppercase tracking-wide">Recalibration Parameters (Required)</label>
                            <textarea
                              placeholder="e.g., Change Wednesday to a rest day, or remove squats due to knee pain."
                              value={recalibrationPrompt}
                              onChange={(e) => setRecalibrationPrompt(e.target.value)}
                              className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-400 min-h-[80px]"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-2 italic">The AI will strictly preserve the rest of your matrix and only apply these targeted edits. You must specify what to change.</p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          {showRecalibrate && (
                            <button 
                              onClick={() => { setShowRecalibrate(false); setRecalibrationPrompt(""); }}
                              className="flex-1 px-6 py-3 font-bold text-slate-300 bg-slate-800 rounded-md transition-all hover:bg-slate-700 uppercase tracking-wider text-xs"
                            >
                              Cancel
                            </button>
                          )}
                          <button 
                            onClick={handleRegenerate}
                            disabled={generating || Boolean(schedule && showRecalibrate && recalibrationPrompt.trim() === '')}
                            className="flex-1 px-6 py-3 font-bold text-black bg-emerald-500 rounded-md transition-all hover:bg-emerald-400 disabled:opacity-50 uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            {generating ? "Recalibrating..." : schedule ? "Confirm Edit" : "Initiate Generation"}
                          </button>
                        </div>
                          <p className="mt-4 text-xs text-slate-500 italic max-w-md mx-auto text-center leading-relaxed">
                            Note: This process may take a few moments. The AI is carefully analyzing your telemetry, bio-data, and specific goals to craft a highly personalized protocol.
                          </p>
                      </div>
                    )
                  ) : (
                    <Link
                      href="/onboarding"
                      className="inline-block px-8 py-4 font-bold text-black bg-orange-500 rounded-md transition-all hover:bg-orange-400 uppercase tracking-wider"
                    >
                      Complete Profile to Generate
                    </Link>
                  )}
                </div>
              </>
            )
          )}

          {/* Phase 2: Execution Debrief */}
          {activePhase === 2 && (
            loading || status === "loading" || generating ? (
              <TacticalLoader />
            ) : schedule ? (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-slate-800 pb-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2 md:mb-0">Tactical Execution Matrix</h2>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider">Start Day:</label>
                    <select
                      className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded px-3 py-1 focus:outline-none focus:border-emerald-500"
                      value={startDay}
                      onChange={(e) => {
                        setStartDay(e.target.value);
                        localStorage.setItem("programStartDay", e.target.value);
                      }}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {schedule.map((dayPlan, idx) => {
                  const startIdx = DAYS_OF_WEEK.indexOf(startDay);
                  const actualDayName = DAYS_OF_WEEK[(startIdx + idx) % 7];
                  
                  return (
                  <Link 
                    href={`/workout/${(dayPlan.day || `day-${idx}`).toLowerCase().replace(/\s+/g, '-')}`}
                    key={idx} 
                    className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors group relative block ${(!dayPlan.exercises || dayPlan.exercises.length === 0) ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    {/* Neon accent line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-wider">
                            {actualDayName}
                            <span className="block text-sm text-slate-500 mt-1">Day {idx+1}</span>
                          </h3>
                          <p className="text-emerald-400 font-semibold mt-1">{dayPlan.focus || 'Rest'}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-slate-800 text-xs font-mono rounded-full text-slate-300 mb-1 border border-slate-700">
                            {dayPlan.durationMinutes || 0} MIN
                          </span>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Int: {dayPlan.intensity || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4 mt-6">
                        {dayPlan.exercises && dayPlan.exercises.length > 0 ? (
                          dayPlan.exercises.map((ex, i) => (
                            <div key={i} className="flex flex-col p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-slate-100">{ex?.name || 'Unknown Exercise'}</span>
                                <div className="text-right">
                                  <span className="text-emerald-500 font-mono text-sm block">{ex?.sets || 0}x{ex?.reps || 0}</span>
                                  {ex?.targetWeight && <span className="text-orange-400 font-mono text-xs block">{ex.targetWeight}</span>}
                                </div>
                              </div>
                              {ex?.notes && (
                                <p className="text-xs text-slate-500 line-clamp-2">{ex.notes}</p>
                              )}
                              {ex?.progressiveOverloadLogic && (
                                <p className="text-xs text-emerald-600 mt-1 italic">Logic: {ex.progressiveOverloadLogic}</p>
                              )}
                              {ex?.whyItMatters && !ex?.progressiveOverloadLogic && (
                                <p className="text-xs text-emerald-600/80 mt-1 italic line-clamp-2">Why it matters: {ex.whyItMatters}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center justify-center p-6 text-slate-600 italic">
                            Rest and recover.
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500 text-xl mb-6">No active matrix found.</p>
                <button onClick={() => setActivePhase(1)} className="text-emerald-500 hover:text-emerald-400 underline">Return to Phase 1</button>
              </div>
            )
          )}

          {/* Phase 3: Fuel Logging */}
          {activePhase === 3 && (
            <div className="py-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Fuel Protocol</h2>
              <VisualNutrition />
            </div>
          )}

          {/* Phase 4: System Shutdown */}
          {activePhase === 4 && (
            <div className="py-20 text-center max-w-2xl mx-auto">
              <PowerOff className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-4">System Shutdown</h2>
              <p className="text-slate-400 mb-8">
                All tactical objectives have been logged. Enter rest and recovery mode to optimize biological repair processes before the next cycle.
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-8 py-4 font-bold text-slate-200 bg-red-600/20 border border-red-500/50 rounded-md transition-all hover:bg-red-600 hover:text-white uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.2)]"
              >
                Confirm Shutdown
              </button>
            </div>
          )}
        </div>
        </div>
        ) : (
          <FieldForge 
            bioData={localStorage.getItem("bioData") ? JSON.parse(localStorage.getItem("bioData") || "{}") : {}} 
            initialSchedule={activePlanMode === "FIELD" ? schedule : null}
            initialSport={activePlanMode === "FIELD" ? (directive || "") : ""}
            onGenerationStateChange={setGenerating}
          />
        )}
      </div>
    </div>
  );
}
