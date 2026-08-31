"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

const PLAYLIST = [
  "/audio/track1.mp3",
  "/audio/track2.mp3",
  "/audio/track3.mp3",
];

export default function GymAmbience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt to autoplay on mount, but catch browser rejections
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Autoplay blocked by browser. User interaction required.");
          setIsPlaying(false);
        }
      }
    };
    playAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log("Play failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleEnded = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const toggleSound = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center">
      <audio
        ref={audioRef}
        src={PLAYLIST[currentTrackIndex]}
        onEnded={handleEnded}
        preload="auto"
      />
      <button
        onClick={toggleSound}
        className={`p-3 rounded-full transition-all ${
          isPlaying
            ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"
            : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 hover:bg-slate-700"
        }`}
        title="Toggle Gym Ambience"
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
}
