"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LitmusTestPage() {
  const router = useRouter();
  const [testData, setTestData] = useState({
    pushups: "",
    squats: "",
    plank: "",
  });
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasCompletedTimer, setHasCompletedTimer] = useState(false);
  const [assessment, setAssessment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setHasCompletedTimer(true);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsTimerRunning(true);
    setHasCompletedTimer(false);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setHasCompletedTimer(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestData({ ...testData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTimerRunning || !hasCompletedTimer) return; // Prevent submission if timer isn't completed
    
    setLoading(true);

    const bioData = JSON.parse(localStorage.getItem("bioData") || "{}");

    try {
      const res = await fetch("/api/ai/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioData, litmusTest: testData }),
      });
      const data = await res.json();
      if (data.assessment) {
        setAssessment(data.assessment);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
    } finally {
      setLoading(false);
    }
  };

  if (assessment) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Your Reality Check
          </h1>
          <div className="prose prose-invert max-w-none text-gray-300">
            {assessment.split("\n").map((para, i) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
          Litmus Test
        </h1>
        <p className="text-gray-400 text-center mb-6">Let's see where you're currently at.</p>

        <div className="mb-8 p-4 bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-gray-700">
          <div className="text-4xl font-mono mb-3">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-2">
            <button onClick={() => startTimer(60)} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded">1 Min</button>
            <button onClick={() => startTimer(120)} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded">2 Min</button>
            <button onClick={stopTimer} className="px-3 py-1 text-sm bg-red-900/50 hover:bg-red-900 rounded text-red-200">Stop</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Pushups in 1 Min</label>
            <input
              type="number"
              name="pushups"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
              value={testData.pushups}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Squats in 1 Min</label>
            <input
              type="number"
              name="squats"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
              value={testData.squats}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Plank Hold (Seconds)</label>
            <input
              type="number"
              name="plank"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
              value={testData.plank}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading || isTimerRunning || !hasCompletedTimer}
            className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Analyzing Data...</span>
            ) : isTimerRunning ? (
              "Test in Progress..."
            ) : !hasCompletedTimer ? (
              "Run Timer to Unlock"
            ) : (
              "Get Reality Check"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
