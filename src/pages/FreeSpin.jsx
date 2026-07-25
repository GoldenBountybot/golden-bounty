import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Gift, Clock, Coins, Sparkles, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import SpinWheel from '@/components/freespin/SpinWheel';

// Wheel segments in the uploaded board's clockwise order (segment 1 is the
// first slice immediately clockwise of the top divider). Colors are kept for the
// result banner; the wheel itself is the uploaded image.
const SEGMENTS = [
  { label: '0.05$',  value: 0.05,  color: '#2c3e50' },
  { label: '0.10$',  value: 0.10,  color: '#8e44ad' },
  { label: '0.25$',  value: 0.25,  color: '#27ae60' },
  { label: '0.50$',  value: 0.50,  color: '#2c3e50' },
  { label: '0.75$',  value: 0.75,  color: '#e74c3c' },
  { label: '1$',     value: 1,     color: '#c5a34d', gold: true },
  { label: '2.5$',   value: 2.5,   color: '#27ae60' },
  { label: '5$',     value: 5,     color: '#8e44ad' },
  { label: '$$',     value: 2000,  color: '#2c3e50', jackpot: true },
  { label: '10$',    value: 10,    color: '#2c3e50' },
  { label: '25$',    value: 25,    color: '#27ae60' },
  { label: '50$',    value: 50,    color: '#e74c3c' },
  { label: '100$',   value: 100,   color: '#8e44ad' },
  { label: '150$',   value: 150,   color: '#27ae60' },
  { label: '200$',   value: 200,   color: '#c5a34d', gold: true },
  { label: '250$',   value: 250,   color: '#2c3e50' },
  { label: '500$',   value: 500,   color: '#e74c3c' },
  { label: '750$',   value: 750,   color: '#8e44ad' },
  { label: '1000$',  value: 1000,  color: '#c5a34d', gold: true },
];

// Weighted random — small prizes common, big/jackpot rare (matches SEGMENTS order).
const WEIGHTS = [40, 40, 35, 30, 25, 22, 16, 12, 1, 10, 8, 5, 3, 2.5, 2, 1.5, 1, 1, 1];

const COOLDOWN_MS = 0; // TEST MODE — no cooldown. Restore to 24 * 60 * 60 * 1000 (24h) for production.

function pickIndex() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return WEIGHTS.length - 1;
}

function fmt(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const W = { fontFamily: 'Rye, Georgia, serif' };
const woodBtn = {
  background: 'linear-gradient(145deg,#f3d77a,#c8932e 45%,#7a4f17 78%,#4a2f10)',
  border: '1px solid rgba(190,140,55,0.85)',
  color: '#1a1206',
  boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.6), inset 0 -2px 3px rgba(0,0,0,0.4), 0 0 14px rgba(255,200,80,0.5)',
};

export default function FreeSpin() {
  const { balance, setBalance } = useCasinoBalance();
  const [lastSpinAt, setLastSpinAt] = useState(null); // null = still loading
  const [now, setNow] = useState(Date.now());
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const awardRef = useRef(null);

  // Load the last-spin timestamp from the user record (server-persisted).
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!m) return;
        const v = Number(me?.last_daily_spin_at || 0);
        setLastSpinAt(isFinite(v) ? v : 0);
      } catch {
        if (m) setLastSpinAt(0);
      }
    })();
    return () => { m = false; };
  }, []);

  // 1-second tick for the countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = lastSpinAt == null ? null : Math.max(0, COOLDOWN_MS - (now - lastSpinAt));
  const available = lastSpinAt != null && remaining === 0;

  const handleSpin = useCallback(() => {
    if (spinning || !available) return;
    setSpinning(true);
    setResult(null);
    setError('');
    const idx = pickIndex();
    awardRef.current = SEGMENTS[idx];
    const segAngle = 360 / SEGMENTS.length;
    const center = (idx + 0.5) * segAngle;         // uploaded board: seg idx center sits at (idx+0.5)*seg from the top divider
    const targetMod = (360 - center) % 360;        // rotation that puts it under the top pointer
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const turns = 6;
    setRotation(rotation + turns * 360 + delta);
  }, [spinning, available, rotation]);

  const handleRest = useCallback(async () => {
    const seg = awardRef.current;
    if (!seg) return;
    const win = Number(seg.value) || 0;
    setBalance((b) => b + win);
    setResult({ ...seg, win });
    const ts = Date.now();
    setLastSpinAt(ts);
    setSpinning(false);
    try {
      await base44.auth.updateMe({ last_daily_spin_at: ts });
    } catch {
      /* cooldown persist is best-effort */
    }
  }, [setBalance]);

  return (
    <div className="min-h-screen relative" style={{ ...W, backgroundImage: 'linear-gradient(rgba(10,8,6,0.55), rgba(10,8,6,0.7)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bd52e9c49_file_00000000a50c8207b70a5b0acc15d3dc.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-3 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 text-amber-300">
            <ChevronLeft className="w-6 h-6" strokeWidth={2.6} />
          </Link>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="font-black italic text-yellow-300 tracking-wider drop-shadow-[0_0_6px_rgba(255,200,0,0.6)]">DAILY FREE SPIN</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}>
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black italic text-yellow-100 tabular-nums">${balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center">
        {/* Wheel — transparent surroundings, floats on the page bg */}
        <SpinWheel segments={SEGMENTS} rotation={rotation} onRest={handleRest} size={340} />

        {/* Result banner */}
        {result && (
          <div className="mt-6 w-full max-w-xs mx-auto rounded-xl px-4 py-3 text-center animate-[saWinPop_0.5s_ease-out]"
            style={{ ...woodBtn, boxShadow: '0 0 22px rgba(255,200,80,0.7)' }}>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              <span className="font-black italic text-lg text-stone-900">
                {result.jackpot ? `JACKPOT! $${result.win.toFixed(2)}` : `You won $${result.win.toFixed(2)}!`}
              </span>
            </div>
          </div>
        )}

        {/* Spin / cooldown control */}
        <div className="mt-6 w-full max-w-xs">
          {available ? (
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full py-3.5 rounded-xl text-base font-black italic tracking-widest disabled:opacity-60 active:scale-95 transition-transform flex items-center justify-center gap-2"
              style={woodBtn}
            >
              <Sparkles className="w-5 h-5" /> {spinning ? 'SPINNING…' : 'SPIN NOW'}
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-xl text-center" style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,17,13,0.7)' }}>
              <div className="flex items-center justify-center gap-2 text-amber-200/90">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold italic tracking-wide">NEXT SPIN IN</span>
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums text-yellow-300" style={{ textShadow: '0 0 10px rgba(255,200,80,0.6)' }}>
                {remaining == null ? '—:—:—' : fmt(remaining)}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-amber-200/60 italic" style={{ fontFamily: 'Georgia, serif' }}>
          One free spin every 24 hours · prizes credited to your balance instantly
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}