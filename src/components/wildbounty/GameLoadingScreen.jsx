import React, { useEffect, useRef, useState } from 'react';
import PremiumGameLoader from '@/components/PremiumGameLoader';

// Loading screen shown when entering Wild Bounty. Plays the uploaded intro
// sound and reveals the game only after the sound finishes.
const SOUND_URL = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/73abdca12_20260717094905.mp3';
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
      if (ac.state === 'suspended' && ac.resume) ac.resume();
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
    // gameplay. Fade it out (no click), pause, abort buffering, and close the
    // context so the audio element can never resume once gameplay begins.
    let stopped = false;
    const stopIntro = () => {
      if (stopped) return;
      stopped = true;
      try {
        if (ac && chain && chain.out) {
          const t = ac.currentTime;
          chain.out.gain.cancelScheduledValues(t);
          chain.out.gain.setValueAtTime(chain.out.gain.value, t);
          chain.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        }
      } catch { /* noop */ }
      try { audio.pause(); } catch { /* noop */ }
      try { audio.currentTime = 0; } catch { /* noop */ }
      try { audio.load(); } catch { /* noop */ } // abort any pending buffering
      try {
        if (ac) {
          const p = ac.close();
          if (p && p.catch) p.catch(() => { /* noop */ });
        }
      } catch { /* noop */ }
    };

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setProgress(100);
      stopIntro();
      setTimeout(() => onDone && onDone(), 220);
    };

    const onEnded = () => reveal();
    const onTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
      }
    };
    const onError = () => reveal();

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', onError);

    // Safety cap: never let the intro block gameplay longer than 5.5s. If the
    // sound is still playing (e.g. the AudioContext was suspended and the
    // intro would otherwise only resume on the first in-game tap), cut it now
    // so the entrance sound can never be heard during gameplay.
    const cap = setTimeout(reveal, 5500);

    // Browsers require a user gesture to play audio; the navigation click
    // that brought us here counts, so playback should start immediately.
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => reveal()); // autoplay blocked — timed reveal
    }

    return () => {
      clearTimeout(cap);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
      stopIntro();
    };
  }, [onDone]);

  return <PremiumGameLoader progress={progress} title="Wild Bounty Showdown" />;
}