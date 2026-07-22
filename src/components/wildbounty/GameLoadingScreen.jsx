import React, { useEffect, useRef, useState } from 'react';

// Loading screen shown when entering Wild Bounty. Plays the uploaded intro
// sound and reveals the game only after the sound finishes.
const SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/73abdca12_20260717094905.mp3';
const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

export default function GameLoadingScreen({ onDone }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio(SOUND_URL);
    audio.volume = 1;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Route through an AudioContext equaliser to clean up and brighten the
    // uploaded sound: cut muddy low-mid, lift presence/clarity, gentle gain.
    let ac = null;
    let srcNode = null;
    let chain = null;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      srcNode = ac.createMediaElementSource(audio);

      const lowShelf = ac.createBiquadFilter();   // clean up muddy lows
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 120;
      lowShelf.gain.value = -4;

      const lowMid = ac.createBiquadFilter();     // cut boxy low-mid
      lowMid.type = 'peaking';
      lowMid.frequency.value = 350;
      lowMid.Q.value = 1;
      lowMid.gain.value = -3;

      const presence = ac.createBiquadFilter();   // add clarity/presence
      presence.type = 'peaking';
      presence.frequency.value = 3000;
      presence.Q.value = 0.8;
      presence.gain.value = 5;

      const highShelf = ac.createBiquadFilter();  // lift airy treble
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 8000;
      highShelf.gain.value = 6;

      const out = ac.createGain();
      out.gain.value = 1.25;                       // small overall boost

      srcNode.connect(lowShelf);
      lowShelf.connect(lowMid);
      lowMid.connect(presence);
      presence.connect(highShelf);
      highShelf.connect(out);
      out.connect(ac.destination);
      chain = { lowShelf, lowMid, presence, highShelf, out };
    } catch {
      // EQ unavailable — plain <audio> playback still works.
    }

    // Stop the intro sound the instant loading ends so it never leaks into
    // gameplay. Guard against double-close (onEnded + unmount) and handle
    // the close() promise so it never becomes an unhandled rejection.
    let stopped = false;
    const stopIntro = () => {
      if (stopped) return;
      stopped = true;
      try { audio.pause(); } catch { /* noop */ }
      try { audio.currentTime = 0; } catch { /* noop */ }
      try {
        if (ac) {
          const p = ac.close();
          if (p && p.catch) p.catch(() => { /* noop */ });
        }
      } catch { /* noop */ }
    };

    const onEnded = () => {
      stopIntro();
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
      stopIntro();
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
        const fallback = setTimeout(() => { stopIntro(); onDone && onDone(); }, 4000);
        audio.addEventListener('ended', () => clearTimeout(fallback), { once: true });
      });
    }

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
      stopIntro();
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
          <img
            src={LOGO_URL}
            alt="Golden Bounty"
            className="w-16 h-16 rounded-full object-cover animate-[saGlowPulse_1.6s_ease-in-out_infinite]"
            style={{ border: '1px solid rgba(214,178,98,0.7)', boxShadow: '0 0 16px rgba(255,200,80,0.7)' }}
          />
        </div>
      </div>

      <p
        className="text-[13px] text-amber-300/80 italic tracking-[0.25em] uppercase mb-1"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Made By Golden Bounty
      </p>

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