import { useState, useEffect } from 'react';

// Global mute flag shared across all games. Each game's sound system can
// check isMuted() before playing sounds so a single toggle silences every
// game. The flag persists in localStorage so it survives page reloads.
const KEY = 'gb_global_muted';
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* ignore */ }
const listeners = new Set();

function persist() { try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* ignore */ } }

export function isMuted() { return muted; }

export function setMuted(v) {
  muted = !!v;
  persist();
  listeners.forEach((l) => l(muted));
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

// React hook — components get [muted, toggle] and re-render on change.
export function useMute() {
  const [m, setM] = useState(muted);
  useEffect(() => {
    listeners.add(setM);
    return () => listeners.delete(setM);
  }, []);
  return [m, toggleMute];
}