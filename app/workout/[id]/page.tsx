"use client";

import { useState, useEffect, useRef, use } from 'react';
import { Play, Pause, CheckCircle2, ChevronRight, Activity, X, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import VideoFormAnalyzer from '@/components/VideoFormAnalyzer';

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkoutPage({ params }: WorkoutPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const unwrappedParams = use(params);
  const workoutId = unwrappedParams.id;

  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Workout State
  const [sets, setSets] = useState([{ reps: 0, weight: 0, completed: false }]);
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Feedback State
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');

  // Sample exercise name for this page
  const exerciseName = "Barbell Squat";

  useEffect(() => {
    async function fetchVideo() {
      try {
        const res = await fetch(`/api/video?query=${encodeURIComponent(exerciseName)}`);
        const data = await res.json();
        if (data.videoId) {
          setVideoId(data.videoId);
        }
      } catch (err) {
        console.error("Failed to fetch video", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
  }, [exerciseName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0, completed: false }]);
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const toggleSetComplete = (index: number) => {
    const newSets = [...sets];
    newSets[index].completed = !newSets[index].completed;
    setSets(newSets);
  };

  const handleFinish = () => {
    setIsFinished(true);
    setIsTimerRunning(false);
  };

  const handleSubmitFeedback = async () => {
    try {
      const currentUserId = (session?.user as any)?.id || session?.user?.name || session?.user?.email || "user_123";
      
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          sessionData: { workoutId, exerciseName, rpe, notes, setsCompleted: sets },
        }),
      });

      const data = await res.json();
      if (data.debrief && data.debrief.debriefMessage) {
        toast.success(`TACTICAL DEBRIEF:\n\n${data.debrief.debriefMessage}`);
      }
    } catch (e) {
      console.error(e);
    }
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-slate-800 p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white leading-tight">{exerciseName}</h1>
            <p className="text-xs text-slate-400">Workout ID: {workoutId}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 shrink-0">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-emerald-400">
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="font-mono text-emerald-400 text-sm">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Video Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Form Reference</h2>
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {loading ? (
              <Activity className="animate-spin text-emerald-500" />
            ) : videoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            ) : (
              <p className="text-slate-500 text-sm">No video found</p>
            )}
          </div>
        </section>

        {/* Sets Tracker */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Log Sets</h2>
            <button onClick={addSet} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              + ADD SET
            </button>
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  set.completed ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                  {index + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(index, 'weight', Number(e.target.value))}
                      placeholder="lbs"
                      className="w-full bg-black border border-slate-700 rounded-lg py-2 px-3 text-white text-center focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(index, 'reps', Number(e.target.value))}
                      placeholder="reps"
                      className="w-full bg-black border border-slate-700 rounded-lg py-2 px-3 text-white text-center focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => toggleSetComplete(index)}
                  className={`p-2 rounded-lg transition-colors ${
                    set.completed ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600 bg-black border border-slate-800 hover:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={24} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AI Video Form Analysis (Virtual Spotter) */}
        <section className="pt-6 border-t border-slate-800">
          <VideoFormAnalyzer />
        </section>
      </main>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleFinish}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            FINISH EXERCISE <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setIsFinished(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div>
              <h3 className="text-xl font-bold text-white">Great job!</h3>
              <p className="text-slate-400 text-sm mt-1">How did that feel? Your feedback helps tailor your next session.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex justify-between">
                <span>RPE (Effort)</span>
                <span className="text-emerald-400">{rpe} / 10</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                <span>Easy</span>
                <span>Max Effort</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Notes (Fatigue/Pain)
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any pain? Did it feel too heavy?"
                className="w-full bg-black border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 h-24 resize-none placeholder:text-slate-600"
              />
            </div>

            <button 
              onClick={handleSubmitFeedback}
              className="w-full py-4 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-transform active:scale-95"
            >
              LOG WORKOUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
