"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, Video } from "lucide-react";

interface AnalysisResult {
  status: "correct" | "incorrect";
  correction: string;
  details: string;
}

export default function VideoFormAnalyzer() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
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
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
      }
    }
  };

  const processVideo = async () => {
    if (!videoFile) return;

    try {
      setIsUploading(true);
      setError(null);

      // 1. Upload to S3 via our API
      const formData = new FormData();
      formData.append("video", videoFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload video");
      }

      const uploadData = await uploadRes.json();
      setIsUploading(false);

      // 2. Analyze with Gemini
      setIsAnalyzing(true);
      const analyzeRes = await fetch("/api/ai/analyze-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploadData.url }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Failed to analyze video");
      }

      const analyzeData = await analyzeRes.json();
      setResult(analyzeData.analysis);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-200">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <Video className="w-8 h-8 text-emerald-400" />
          Virtual Spotter
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Upload your set and let our AI analyze your biomechanics in seconds.
        </p>
      </div>

      {!videoFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group"
        >
          <UploadCloud className="w-12 h-12 mx-auto text-slate-500 group-hover:text-emerald-400 transition-colors mb-4" />
          <p className="text-lg font-medium text-slate-300 group-hover:text-emerald-300">
            Drag & drop your video here
          </p>
          <p className="text-sm text-slate-500 mt-2">or click to browse from your device</p>
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-inner">
            <video
              src={videoPreviewUrl!}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => {
                setVideoFile(null);
                setVideoPreviewUrl(null);
                setResult(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              disabled={isUploading || isAnalyzing}
            >
              Upload a different video
            </button>

            <button
              onClick={processVideo}
              disabled={isUploading || isAnalyzing || !!result}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading Video...
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Analyzing Biomechanics...
                </>
              ) : result ? (
                <>Analysis Complete</>
              ) : (
                <>Analyze Form</>
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
        <div
          className={`mt-8 p-6 rounded-xl border ${
            result.status === "correct"
              ? "bg-emerald-950/30 border-emerald-900/50"
              : "bg-amber-950/30 border-amber-900/50"
          } animate-in fade-in slide-in-from-bottom-4 duration-500`}
        >
          <div className="flex items-start gap-4">
            {result.status === "correct" ? (
              <div className="p-3 bg-emerald-500/20 rounded-full shrink-0">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            ) : (
              <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className={`text-xl font-bold tracking-tight ${
                result.status === "correct" ? "text-emerald-400" : "text-amber-400"
              }`}>
                {result.status === "correct" ? "Great Form!" : "Form Correction Required"}
              </h3>
              <p className="text-lg text-white font-medium">
                {result.correction}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {result.details}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
