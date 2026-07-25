import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Sparkles, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import GameHeader from '@/components/GameHeader';
import SpinWheel from '@/components/freespin/SpinWheel';
import WoodFrame from '@/components/freespin/WoodFrame';

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

const COOLDOWN_MS = 0; // TEST MODE — no cooldown. Restore to 24 * 60 * 60 * 1000 (24h) for production.

// Deterministic daily streak prizes (Western bounty ladder). Direct prizes
// credit to the balance instantly. "held" prizes do NOT credit yet — they are
// stored as pending and only land in the wallet once the player deposits the
// same amount and Stacks it within 24 hours. After day 4 the ladder cycles.
const DAILY_PRIZES = [
  { value: 0.05, held: false }, // Day 1
  { value: 0.10, held: false }, // Day 2
  { value: 100,  held: true },  // Day 3
  { value: 50,   held: true },  // Day 4
];

function prizeForDay(spinCount) {
  // Day 5 onward — always $0.05 directly, the ladder does not cycle.
  if (spinCount >= DAILY_PRIZES.length) return { value: 0.05, held: false };
  return DAILY_PRIZES[spinCount];
}

function segmentIndexForValue(value) {
  const i = SEGMENTS.findIndex((s) => Number(s.value) === Number(value));
  return i === -1 ? 0 : i;
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
  const [spinCount, setSpinCount] = useState(0); // total daily spins done (drives the prize ladder)
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
        const c = Number(me?.daily_spin_count || 0);
        setSpinCount(isFinite(c) ? c : 0);
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
    const prize = prizeForDay(spinCount);
    awardRef.current = prize;
    const idx = segmentIndexForValue(prize.value);
    const segAngle = 360 / SEGMENTS.length;
    const center = (idx + 0.5) * segAngle;         // uploaded board: seg idx center sits at (idx+0.5)*seg from the top divider
    const targetMod = (360 - center) % 360;        // rotation that puts it under the top pointer
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const turns = 6;
    setRotation(rotation + turns * 360 + delta);
  }, [spinning, available, rotation, spinCount]);

  const handleRest = useCallback(async () => {
    const prize = awardRef.current;
    if (!prize) return;
    const win = Number(prize.value) || 0;
    const ts = Date.now();
    const nextCount = spinCount + 1;
    if (prize.held) {
      // Held prize — does NOT credit yet. Stored as pending; it lands in the
      // wallet only once the player deposits the same amount and Stacks it
      // within 24 hours.
      setResult({ ...prize, win, held: true, expires_at: ts + 24 * 60 * 60 * 1000 });
    } else {
      setBalance((b) => b + win);
      setResult({ ...prize, win });
    }
    setLastSpinAt(ts);
    setSpinning(false);
    setSpinCount(nextCount);
    try {
      await base44.auth.updateMe({
        last_daily_spin_at: ts,
        daily_spin_count: nextCount,
        pending_daily_prize: prize.held
          ? { amount: win, expires_at: ts + 24 * 60 * 60 * 1000, spin_at: ts }
          : null,
      });
    } catch {
      /* cooldown persist is best-effort */
    }
  }, [setBalance, spinCount]);

  return (
    <div className="min-h-screen relative" style={{ ...W, backgroundImage: 'linear-gradient(rgba(10,8,6,0.8), rgba(10,8,6,0.8)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bd52e9c49_file_00000000a50c8207b70a5b0acc15d3dc.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Header */}
      <GameHeader title="Daily Free Spin" balance={balance} />

      <main className="max-w-md mx-auto px-4 pt-6 pb-6 flex flex-col items-center">
        {/* Reserved slot above the wheel — win message floats up into it */}
        <div className="relative w-full max-w-xs mx-auto mb-2" style={{ height: result?.held ? 108 : 56 }}>
          {result && (
            <div className="absolute inset-0 flex items-center justify-center animate-[freeWinFloat_0.6s_ease-out]">
              <WoodFrame variant="msg" className="w-full text-center"
                style={{ boxShadow: '0 0 22px rgba(255,200,80,0.5)' }}>
                <div className="flex flex-col items-center justify-center gap-1 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5" style={{ color: '#c5a059' }} />
                    <span className="font-black italic text-base" style={{ color: '#c5a059', textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}>
                      {result.jackpot ? `JACKPOT! $${result.win.toFixed(2)}` : `You won $${result.win.toFixed(2)}!`}
                    </span>
                  </div>
                  {result.held && (
                    <p className="text-[11px] italic leading-tight" style={{ color: '#f5d77a', fontFamily: 'Georgia, serif' }}>
                      এই পরিমাণ আপনার wallet যুক্ত হবে যখন আপনি সমপরিমাণ ডিপোজিট করে Stack করবেন ২৪ ঘন্টার ভিতরে
                    </p>
                  )}
                </div>
              </WoodFrame>
            </div>
          )}
        </div>

        {/* Wheel — transparent surroundings, floats on the page bg */}
        <SpinWheel segments={SEGMENTS} rotation={rotation} onRest={handleRest} size={340} />

        {/* Spin / cooldown control — western wooden frame */}
        <div className="mt-6 w-full max-w-xs">
          {available ? (
            <WoodFrame variant="btn">
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-full text-base font-black italic tracking-widest disabled:opacity-60 active:scale-95 transition-transform flex items-center justify-center gap-2"
                style={{ color: '#c5a059', textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}
              >
                <Sparkles className="w-5 h-5" /> {spinning ? 'SPINNING…' : 'SPIN NOW'}
              </button>
            </WoodFrame>
          ) : (
            <WoodFrame variant="msg" className="w-full text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#c5a059' }} />
                <span className="text-xs font-bold italic tracking-wide" style={{ color: '#c5a059' }}>NEXT SPIN IN</span>
              </div>
              <div className="mt-0.5 text-2xl font-black tabular-nums" style={{ color: '#f5d77a', textShadow: '0 0 10px rgba(255,200,80,0.6)' }}>
                {remaining == null ? '—:—:—' : fmt(remaining)}
              </div>
            </WoodFrame>
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