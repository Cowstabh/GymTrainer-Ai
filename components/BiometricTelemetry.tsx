"use client";

import { useState, useEffect } from "react";

export default function BiometricTelemetry() {
  const [telemetry, setTelemetry] = useState({
    domsLocation: "",
    cnsFatigue: "low",
    commuteType: "car",
    weather: "clear",
    injuryConstraints: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("telemetryData");
    if (stored) {
      try {
        setTelemetry(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setTelemetry((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("telemetryData", JSON.stringify(telemetry));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.15)]">
      {/* Intense styling elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-red-500 animate-pulse">●</span> Pre-Strike Telemetry
          </h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-mono">
            Calibrate environmental & biometric variables
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
        {/* DOMS Location */}
        <div className="space-y-2">
          <label className="block text-red-400 uppercase font-bold tracking-wider">DOMS / Soreness Location</label>
          <input 
            type="text" 
            placeholder="e.g. Quads, Lower Back, None" 
            value={telemetry.domsLocation}
            onChange={(e) => handleChange("domsLocation", e.target.value)}
            className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Injury Constraints */}
        <div className="space-y-2">
          <label className="block text-red-400 uppercase font-bold tracking-wider">Injury Constraints</label>
          <input 
            type="text" 
            placeholder="e.g. ATFL sprain, Right shoulder tweak" 
            value={telemetry.injuryConstraints}
            onChange={(e) => handleChange("injuryConstraints", e.target.value)}
            className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        {/* CNS Fatigue */}
        <div className="space-y-2">
          <label className="block text-red-400 uppercase font-bold tracking-wider">CNS Fatigue Level</label>
          <select 
            value={telemetry.cnsFatigue}
            onChange={(e) => handleChange("cnsFatigue", e.target.value)}
            className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors appearance-none"
          >
            <option value="low">Low (Ready to Kill)</option>
            <option value="moderate">Moderate (Standard Op)</option>
            <option value="severe">Severe (Compromised)</option>
          </select>
        </div>

        {/* Commute Type */}
        <div className="space-y-2">
          <label className="block text-red-400 uppercase font-bold tracking-wider">Commute Type</label>
          <select 
            value={telemetry.commuteType}
            onChange={(e) => handleChange("commuteType", e.target.value)}
            className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors appearance-none"
          >
            <option value="car">Car (Low Impact)</option>
            <option value="motorcycle">Motorcycle (High Vigilance/Fatigue)</option>
            <option value="train">Train (Stationary)</option>
            <option value="walk">Walk/Cycle (Pre-exhausted)</option>
          </select>
        </div>

        {/* Weather */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <label className="block text-red-400 uppercase font-bold tracking-wider">Weather Conditions</label>
          <select 
            value={telemetry.weather}
            onChange={(e) => handleChange("weather", e.target.value)}
            className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors appearance-none"
          >
            <option value="clear">Clear / Optimal</option>
            <option value="extreme_heat">Extreme Heat</option>
            <option value="rain">Heavy Rain</option>
            <option value="cold">Freezing</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSave}
          className="relative inline-flex items-center justify-center px-8 py-3 font-bold text-black bg-red-600 rounded uppercase tracking-widest hover:bg-red-500 transition-all"
        >
          {saved ? "Telemetry Locked ✓" : "Lock Telemetry"}
        </button>
      </div>
    </div>
  );
}
