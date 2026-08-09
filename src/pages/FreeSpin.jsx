import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Sparkles, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import BackButton from '@/components/BackButton';
import GameTitleBar from '@/components/GameTitleBar';
import GameAssetLoader from '@/components/GameAssetLoader';
import { FREE_SPIN_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { Wallet, Volume2, VolumeX } from 'lucide-react';
import { useMute } from '@/lib/soundMute';
import SpinWheel from '@/components/freespin/SpinWheel';
import WoodFrame from '@/components/freespin/WoodFrame';
import { startWheelSpin, stopWheelSpin } from '@/components/freespin/wheelSounds';

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

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // One free spin every 24 hours.

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
  const { balance, addRealBalance } = useCasinoBalance();
  const [muted, toggleMute] = useMute();
  const [assetsReady, setAssetsReady] = useState(false);
  const [lastSpinAt, setLastSpinAt] = useState(null); // null = still loading
  const [spinCount, setSpinCount] = useState(0); // total daily spins done
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
    return () => { clearInterval(t); stopWheelSpin(); };
  }, []);

  const remaining = lastSpinAt == null ? null : Math.max(0, COOLDOWN_MS - (now - lastSpinAt));
  const available = lastSpinAt != null && remaining === 0;

  const handleSpin = useCallback(() => {
    if (spinning || !available) return;
    setSpinning(true);
    setResult(null);
    setError('');
    // Pick a random segment — the wheel lands on whatever it lands on, and
    // that exact amount is both shown and credited.
    const idx = Math.floor(Math.random() * SEGMENTS.length);
    awardRef.current = SEGMENTS[idx];
    const segAngle = 360 / SEGMENTS.length;
    // Always land clearly inside the segment (never on a divider edge).
    const frac = 0.3 + Math.random() * 0.4; // 0.3–0.7, biased toward center
    const center = (idx + frac - 0.5) * segAngle;
    const targetMod = (360 - center) % 360;        // rotation that puts it under the top pointer
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const turns = 6;
    const totalRotation = turns * 360 + delta;
    setRotation(rotation + totalRotation);
    startWheelSpin(18, totalRotation, SEGMENTS.length);
  }, [spinning, available, rotation]);

  const handleRest = useCallback(async () => {
    const prize = awardRef.current;
    if (!prize) return;
    const win = Number(prize.value) || 0;
    const ts = Date.now();
    const nextCount = spinCount + 1;
    // Credit the exact amount the wheel landed on — shown and credited are
    // always the same. addRealBalance handles both demo and real mode.
    addRealBalance(win, 'free_spin');
    setResult({ ...prize, win });
    setLastSpinAt(ts);
    setSpinning(false);
    setSpinCount(nextCount);
    stopWheelSpin();
    try {
      await base44.auth.updateMe({
        last_daily_spin_at: ts,
        daily_spin_count: nextCount,
      });
    } catch {
      /* cooldown persist is best-effort */
    }
  }, [addRealBalance, spinCount]);

  if (!assetsReady) {
    return (
      <div className="min-h-screen relative" style={{ ...W, backgroundImage: 'linear-gradient(rgba(10,8,6,0.8), rgba(10,8,6,0.8)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bd52e9c49_file_00000000a50c8207b70a5b0acc15d3dc.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <GameAssetLoader title="Daily Free Spin" assets={FREE_SPIN_ASSETS} bgImage={GAME_BG.freeSpin} onDone={() => setAssetsReady(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ ...W, backgroundImage: 'linear-gradient(rgba(10,8,6,0.8), rgba(10,8,6,0.8)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bd52e9c49_file_00000000a50c8207b70a5b0acc15d3dc.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Daily Free Spin"
          left={<BackButton />}
          right={
            <>
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
              >
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-black tabular-nums text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md active:scale-90 transition-transform"
                style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted
                  ? <VolumeX className="w-5 h-5 text-amber-300" />
                  : <Volume2 className="w-5 h-5 text-amber-300" />}
              </button>
            </>
          }
          maxWidth="max-w-5xl"
        />
      </header>

      <main className="max-w-md lg:max-w-5xl mx-auto px-4 pt-6 pb-2 flex flex-col items-center">
        {/* Reserved slot above the wheel — win message floats up into it */}
        <div className="relative w-full max-w-[230px] mx-auto mb-1" style={{ height: 52 }}>
          {result && (
            <div className="absolute inset-0 flex items-center justify-center animate-[freeWinFloat_0.6s_ease-out]">
              <div className="relative w-full" style={{ filter: 'drop-shadow(0 0 14px rgba(255,200,80,0.45))' }}>
                <img
                  src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/58482abdf_file_0000000099f08207bd615be46766e77b.png"
                  alt="Win banner"
                  draggable={false}
                  className="block w-full h-auto"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-6">
                  <div className="flex items-center justify-center gap-1.5">
                    <Trophy className="w-4 h-4" style={{ color: '#ffe9a8' }} />
                    <span className="font-black italic text-sm" style={{ color: '#ffe9a8', textShadow: '0 1px 2px rgba(0,0,0,0.85)' }}>
                      {result.jackpot ? `JACKPOT! $${result.win.toFixed(2)}` : `You won $${result.win.toFixed(2)}!`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wheel — transparent surroundings, floats on the page bg */}
        <SpinWheel segments={SEGMENTS} rotation={rotation} onRest={handleRest} size={380} />

        {/* Spin / cooldown control — ornate gold SPIN button */}
        <div className="-mt-5 w-full max-w-[160px]">
          {available ? (
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full disabled:opacity-60 active:scale-95 transition-transform"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: spinning ? 'not-allowed' : 'pointer' }}
            >
              <img
                src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2856c6533_file_00000000a3c8820ba092dc2cb1951125.png"
                alt="Spin"
                draggable={false}
                className="block w-full h-auto"
              />
            </button>
          ) : (
            <WoodFrame variant="msg" className="w-full max-w-[130px] text-center translate-x-[7px]">
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: '#c5a059' }} />
                <span className="text-[10px] font-bold italic tracking-wide" style={{ color: '#c5a059' }}>NEXT SPIN IN</span>
              </div>
              <div className="mt-0.5 text-lg font-black tabular-nums" style={{ color: '#f5d77a', textShadow: '0 0 10px rgba(255,200,80,0.6)' }}>
                {remaining == null ? '—:—:—' : fmt(remaining)}
              </div>
            </WoodFrame>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-amber-200/60 italic" style={{ fontFamily: 'Georgia, serif' }}>
          One free spin every 24 hours · prizes credited to your balance instantly
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}