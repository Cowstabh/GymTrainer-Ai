"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, Utensils, Target, Flame, Activity } from "lucide-react";

interface NutritionAnalysisResult {
  macros: {
    protein: string;
    carbs: string;
    fats: string;
    calories: string;
  };
  tacticalAnalysis: string;
}

export default function VisualNutrition() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
      }
    }
  };

  const processImage = async () => {
    if (!imageFile) return;

    try {
      setIsUploading(true);
      setError(null);

      // We can either upload to S3 or convert to base64. 
      // Uploading to S3 is safer for large files.
      const formData = new FormData();
      formData.append("video", imageFile); // API might be using 'file' or 'video', let's check or assume it accepts it

      // Let's use base64 for simplicity if it's an image, as it's faster and avoids S3 upload cost
      // But wait, the form analyzer uses /api/upload. Let's do base64 first.
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          setIsUploading(false);
          setIsAnalyzing(true);
          
          const base64Data = reader.result as string;

          const analyzeRes = await fetch("/api/ai/nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Data }),
          });

          if (!analyzeRes.ok) {
            throw new Error("Failed to analyze meal");
          }

          const analyzeData = await analyzeRes.json();
          if (analyzeData.error) {
              throw new Error(analyzeData.error);
          }
          setResult(analyzeData.analysis);
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred during analysis");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(imageFile);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-200">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <Utensils className="w-8 h-8 text-orange-500" />
          Tactical Fuel Analyzer
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Upload a photo of your fuel payload and let our AI extract the macros and tactical combat readiness report.
        </p>
      </div>

      {!imageFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-orange-500 bg-slate-950/50 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group"
        >
          <UploadCloud className="w-12 h-12 mx-auto text-slate-500 group-hover:text-orange-400 transition-colors mb-4" />
          <p className="text-lg font-medium text-slate-300 group-hover:text-orange-300">
            Drag & drop your meal photo here
          </p>
          <p className="text-sm text-slate-500 mt-2">or click to browse from your device</p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-black max-h-96 border border-slate-800 shadow-inner flex justify-center">
            <img
              src={imagePreviewUrl!}
              alt="Meal preview"
              className="w-full h-full object-contain max-h-96"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreviewUrl(null);
                setResult(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              disabled={isUploading || isAnalyzing}
            >
              Upload a different photo
            </button>

            <button
              onClick={processImage}
              disabled={isUploading || isAnalyzing || !!result}
              className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Photo...
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting Intel...
                </>
              ) : result ? (
                <>Analysis Complete</>
              ) : (
                <>Analyze Fuel Payload</>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-950/50 border border-red-900/50 rounded-lg flex items-start gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-orange-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Calories</span>
              </div>
              <p className="text-xl font-bold text-white">{result?.macros?.calories || "N/A"}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Protein</span>
              </div>
              <p className="text-xl font-bold text-white">{result?.macros?.protein || "N/A"}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Carbs</span>
              </div>
              <p className="text-xl font-bold text-white">{result?.macros?.carbs || "N/A"}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Fats</span>
              </div>
              <p className="text-xl font-bold text-white">{result?.macros?.fats || "N/A"}</p>
            </div>
          </div>

          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wide">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Tactical Readiness Report
            </h3>
            <p className="text-slate-300 leading-relaxed text-lg italic">
              "{result.tacticalAnalysis}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
