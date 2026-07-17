import React, { useEffect, useRef, useState } from 'react';

// Loading screen shown when entering Wild Bounty. Plays the uploaded intro
// sound and reveals the game only after the sound finishes.
const SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/73abdca12_20260717094905.mp3';

export default function GameLoadingScreen({ onDone }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio(SOUND_URL);
    audio.volume = 1;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onEnded = () => {
      setProgress(100);
      setTimeout(() => onDone && onDone(), 250);
    };
    const onTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
      }
    };
    const onError = () => {
      // If the sound fails to load, don't block the game forever.
      setTimeout(() => onDone && onDone(), 1200);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', onError);

    // Browsers require a user gesture to play audio; the navigation click
    // that brought us here counts, so playback should start immediately.
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // Autoplay blocked — fall back to a timed reveal.
        const fallback = setTimeout(() => onDone && onDone(), 4000);
        audio.addEventListener('ended', () => clearTimeout(fallback), { once: true });
      });
    }

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
      try { audio.pause(); } catch { /* noop */ }
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-amber-950/50 to-stone-950">
      {/* Spinning sheriff star loader */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full border-4 border-amber-600/30 border-t-amber-400 animate-spin"
          style={{ boxShadow: '0 0 28px rgba(255,200,80,0.55)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">⭐</span>
        </div>
      </div>

      <h2
        className="text-2xl text-amber-300 font-serif italic mb-6 tracking-wide"
        style={{ fontFamily: 'Rye, Georgia, serif' }}
      >
        Wild Bounty Showdown
      </h2>

      {/* Progress bar synced to the intro sound */}
      <div className="w-64 h-2 rounded-full bg-stone-800 overflow-hidden border border-amber-700/40">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-amber-200/70 tracking-widest uppercase">Loading…</p>
    </div>
  );
}