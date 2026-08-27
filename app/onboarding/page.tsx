"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BioDataPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [journeyType, setJourneyType] = useState("new");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    height: "",
    weight: "",
    goal: "Build Muscle",
    timeframe: "",
    daysPerWeek: "3",
    preferredTime: "Morning",
    targetBodyFocus: "Full Body",
    equipmentProfile: "Full Gym Facility",
    trainerGender: "Male",
  });

  const [baselineData, setBaselineData] = useState({
    rawText: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (journeyType === "new") {
      const currentUserId = (session?.user as any)?.id || session?.user?.name || session?.user?.email;
      localStorage.setItem("bioData", JSON.stringify({ ...formData, journeyType, userId: currentUserId }));
      router.push("/onboarding/litmus");
    } else {
      setStep(2);
    }
  };

  const handleSubmitBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const currentUserId = (session?.user as any)?.id || session?.user?.name || session?.user?.email || "user_123";
    
    // Fix: MUST save to localStorage so the dashboard knows the profile is complete
    const finalBioData = { ...formData, journeyType, userId: currentUserId };
    localStorage.setItem("bioData", JSON.stringify(finalBioData));
    
    try {
      const res = await fetch("/api/onboarding/veteran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          bioData: finalBioData,
          baselineData
        })
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        console.error("Failed to save baseline");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 py-12 relative">
      <Link href="/dashboard" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-gray-400 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
          {step === 1 ? "Your Profile" : "Kinetic Baseline"}
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {step === 1 ? "Customize your training preferences" : "Log your current routine metrics"}
        </p>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Journey Type</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="journeyType"
                    value="new"
                    checked={journeyType === "new"}
                    onChange={() => setJourneyType("new")}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-sm">Initiating New Journey?</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="journeyType"
                    value="resuming"
                    checked={journeyType === "resuming"}
                    onChange={() => setJourneyType("resuming")}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-sm">Resuming Active Deployment?</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                <select
                  name="gender"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Primary Goal</label>
              <select
                name="goal"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                value={formData.goal}
                onChange={handleChange}
              >
                <option>Build Muscle</option>
                <option>Lose Weight</option>
                <option>Improve Endurance</option>
                <option>General Fitness</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Days / Week</label>
                <input
                  type="number"
                  name="daysPerWeek"
                  min="1"
                  max="7"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.daysPerWeek}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preferred Time</label>
                <select
                  name="preferredTime"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.preferredTime}
                  onChange={handleChange}
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Focus</label>
                <select
                  name="targetBodyFocus"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.targetBodyFocus}
                  onChange={handleChange}
                >
                  <option>Full Body</option>
                  <option>Upper Body</option>
                  <option>Lower Body</option>
                  <option>Core</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Timeframe (Wks)</label>
                <input
                  type="number"
                  name="timeframe"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.timeframe}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Operational Environment</label>
              <select
                name="equipmentProfile"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                value={formData.equipmentProfile}
                onChange={handleChange}
              >
                <option>Full Gym Facility (Iron & Machines)</option>
                <option>Home Forge (Dumbbells/Kettlebells)</option>
                <option>Bodyweight Only (Zero Equipment)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Trainer Gender Preference</label>
              <select
                name="trainerGender"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors"
                value={formData.trainerGender}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
                <option>No Preference</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
            >
              {journeyType === "new" ? "Next: Litmus Test" : "Next: Kinetic Baseline"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitBaseline} className="space-y-5">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Operational Situation Report (Sitrep)</label>
              <textarea
                name="rawText"
                rows={6}
                placeholder="e.g., 'I bench press 60kg for 3 sets of 10, squat 100kg for 4x8, and my left shoulder is currently injured.'"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors text-sm text-gray-200 resize-none"
                value={baselineData.rawText}
                onChange={(e) => setBaselineData({ rawText: e.target.value })}
              />
              <p className="text-xs text-gray-500 italic">
                Our intelligence core will automatically extract your exercises, sets, reps, weights, and injury constraints from this text block.
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors border border-gray-600"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Onboarding"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
