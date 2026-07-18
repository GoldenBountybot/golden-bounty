import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import BackButton from '@/components/BackButton';
import ShareButton from '@/components/ShareButton';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const GIRL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9791997c8_generated_image.png';

// 14 segments — gold / dark blue / green / red, with multipliers + USDT "T".
const SEGMENTS = [
  { mult: 500, color: '#D4AF37', jackpot: true },
  { mult: 0,   color: '#0B1D48' },
  { mult: 20,  color: '#1E8A57' },
  { mult: 100, color: '#B22222' },
  { mult: 5,   color: '#0B1D48' },
  { mult: 50,  color: '#D4AF37' },
  { mult: 10,  color: '#B22222' },
  { mult: 200, color: '#1E8A57' },
  { mult: 5,   color: '#0B1D48' },
  { mult: 20,  color: '#D4AF37' },
  { mult: 400, color: '#B22222' },
  { mult: 10,  color: '#1E8A57' },
  { mult: 50,  color: '#0B1D48' },
  { mult: 100, color: '#1E8A57' },
];
const N = SEGMENTS.length;
const SEG = 360 / N;
const BETS = [25, 50, 100, 250, 500];
const LABEL_R = 88; // radius for segment labels (px) inside a 288px wheel

function Tether({ size = 11 }) {
  return (
    <span
      style={{
        width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '9999px', background: '#26A17B', color: '#fff', fontWeight: 900,
        fontSize: size * 0.6, fontFamily: 'sans-serif', border: '1px solid #1e8460',
        boxShadow: '0 0 2px rgba(0,0,0,0.5)',
      }}
    >₮</span>
  );
}

export default function LuckyWheel() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [girlSpin, setGirlSpin] = useState(false);
  const [betIdx, setBetIdx] = useState(1);
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('lucky-wheel');
  const [message, setMessage] = useState('Spin the Wheel!');
  const [lastWin, setLastWin] = useState(0);
  const [jackpot, setJackpot] = useState(false);
  const logActivity = useLogActivity();

  const bet = BETS[betIdx];
  const conic = `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')})`;

  const spin = () => {
    if (spinning) return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    setBalance((b) => b - bet);
    setSpinning(true);
    setJackpot(false);
    setMessage('Spinning...');
    setLastWin(0);

    // Anime girl performs a one-handed spin impulse.
    setGirlSpin(true);
    setTimeout(() => setGirlSpin(false), 720);

    const winIdxs = SEGMENTS.map((_, i) => i).filter((i) => SEGMENTS[i].mult > 0);
    const loseIdxs = SEGMENTS.map((_, i) => i).filter((i) => SEGMENTS[i].mult === 0);
    const pool = Math.random() < (rtp / 100) ? winIdxs : loseIdxs;
    const idx = pool.length ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * N);
    const turns = 5 * 360;
    const finalRot = rotation - (rotation % 360) + turns + (360 - (idx * SEG + SEG / 2));
    setRotation(finalRot);
    setTimeout(() => {
      const mult = SEGMENTS[idx].mult;
      const win = bet * mult;
      if (win > 0) {
        setBalance((b) => b + win);
        setLastWin(win);
        setMessage(`You won $${win.toFixed(2)}! (${mult}x)`);
        if (mult >= 500) setJackpot(true);
      } else {
        setMessage('No win — try again!');
      }
      logActivity('lucky-wheel', bet, win, win > 0 ? 'win' : 'loss');
      setSpinning(false);
    }, 4500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 0%, #122a5c 0%, #0a1a3a 45%, #060d22 100%)' }}>
      {/* faint gold brush accents + script watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(2px 2px at 15% 20%, #D4AF37, transparent), radial-gradient(2px 2px at 80% 30%, #D4AF37, transparent), radial-gradient(1px 1px at 40% 70%, #f0e6c0, transparent)' }} />
      <div className="pointer-events-none absolute top-2 left-0 right-0 text-center" style={{ opacity: 0.12 }}>
        <span className="text-5xl italic" style={{ fontFamily: 'Rye, Georgia, serif', color: '#D4AF37' }}>Lucky Wheel</span>
      </div>

      <header className="sticky top-0 z-30 bg-stone-950/70 backdrop-blur-xl border-b border-amber-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>Lucky Wheel</h1>
          </div>
          <ShareButton />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        {/* Wheel + anime girl */}
        <div className="relative w-72 h-72 mx-auto">
          {/* Red pointer at top */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-40 w-0 h-0 border-l-[11px] border-r-[11px] border-t-[20px] border-l-transparent border-r-transparent" style={{ borderTopColor: '#E02424', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }} />

          {/* Outer metallic rim */}
          <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(145deg,#8a7a4a,#d4c074 30%,#6a5a30 55%,#c9b26a 78%,#8a7a4a)', boxShadow: '0 0 0 2px #2a2210, 0 14px 44px rgba(0,0,0,0.75)' }}>
            {/* studs */}
            {Array.from({ length: 28 }).map((_, i) => {
              const a = (i * (360 / 28)) * Math.PI / 180;
              const r = 138;
              return (
                <span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: `calc(50% + ${Math.cos(a) * r}px)`,
                    top: `calc(50% + ${Math.sin(a) * r}px)`,
                    transform: 'translate(-50%,-50%)',
                    background: 'radial-gradient(circle,#fff7e0,#a07a30)',
                    boxShadow: '0 0 3px rgba(0,0,0,0.6)',
                  }}
                />
              );
            })}
          </div>

          {/* LED backlight ring */}
          <div className="absolute inset-[8px] rounded-full pointer-events-none" style={{ border: '2px solid #f0f8ff', boxShadow: '0 0 14px #f0f8ff, inset 0 0 10px #f0f8ff', animation: 'lwLedPulse 1.8s ease-in-out infinite' }} />

          {/* Rotating segments + labels */}
          <div
            className="absolute inset-[12px] rounded-full overflow-hidden"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: conic }} />
            {/* segment divider lines */}
            {SEGMENTS.map((_, i) => {
              const ang = i * SEG;
              return (
                <div
                  key={'d-' + i}
                  className="absolute left-1/2 top-1/2 origin-top"
                  style={{
                    width: 1, height: '50%', background: 'rgba(0,0,0,0.35)',
                    transform: `translate(-50%,-100%) rotate(${ang}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                />
              );
            })}
            {/* labels */}
            {SEGMENTS.map((s, i) => {
              const ang = i * SEG + SEG / 2;
              return (
                <div
                  key={'l-' + i}
                  className="absolute"
                  style={{ left: '50%', top: '50%', width: 0, height: 0, transform: `rotate(${ang}deg) translateY(-${LABEL_R}px)` }}
                >
                  <div style={{ transform: 'translate(-50%,-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ color: '#F5D77A', fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 16, textShadow: '0 1px 2px rgba(0,0,0,0.85)', lineHeight: 1 }}>
                      {s.mult}x
                    </div>
                    {s.jackpot && (
                      <div style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 800, fontSize: 7, letterSpacing: '0.08em', textShadow: '0 1px 2px rgba(0,0,0,0.85)' }}>JACKPOT</div>
                    )}
                    <div style={{ marginTop: 3, display: 'flex', justifyContent: 'center' }}><Tether size={10} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inner hub */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center z-20"
            style={{ background: '#1A1A1A', border: '2px solid #D4AF37', boxShadow: '0 0 12px rgba(0,0,0,0.85), inset 0 0 6px rgba(212,175,55,0.4)' }}
          >
            <span style={{ color: '#D4AF37', fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '0.08em', fontSize: 11 }}>WHEEL</span>
          </div>

          {/* Anime girl — reaches in and spins with one hand */}
          <img
            src={GIRL_IMG}
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              right: -56,
              bottom: -18,
              width: 150,
              height: 'auto',
              zIndex: 25,
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))',
              animation: girlSpin ? 'lwGirlSpin 0.72s ease-out' : 'none',
            }}
          />
        </div>

        {/* Message */}
        <div className="w-full text-center py-2 rounded-md" style={{ background: 'linear-gradient(to bottom, rgba(58,40,18,0.9), rgba(26,18,9,0.92))', border: '1px solid rgba(190,140,55,0.75)' }}>
          <span className="font-black italic text-lg" style={{ color: jackpot ? '#fde68a' : '#f5c542', fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
            {jackpot ? `JACKPOT! ${message}` : message}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { l: 'Balance', v: `$${balance.toFixed(2)}` },
            { l: 'Bet', v: `$${bet}` },
            { l: 'Last Win', v: `$${lastWin.toFixed(2)}` },
          ].map((s) => (
            <div key={s.l} className="rounded-md py-2 text-center" style={{ background: 'linear-gradient(to bottom, rgba(58,40,18,0.9), rgba(26,18,9,0.92))', border: '1px solid rgba(190,140,55,0.75)' }}>
              <p className="text-[9px] text-amber-300/70 tracking-widest uppercase">{s.l}</p>
              <p className="text-sm font-bold italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Bet selector */}
        <div className="flex gap-2 flex-wrap justify-center">
          {BETS.map((b, i) => (
            <button
              key={b}
              disabled={spinning}
              onClick={() => setBetIdx(i)}
              className={`px-3 py-1.5 rounded-md text-sm font-bold italic border transition-colors ${betIdx === i ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'} disabled:opacity-50`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              ${b}
            </button>
          ))}
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="w-full py-4 rounded-xl text-lg font-black italic shadow-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, #D4AF37, #B8860B)', color: '#1a1206', fontFamily: 'Rye, Georgia, serif', border: '1px solid #f5e0a0', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 6px 18px rgba(180,134,11,0.5)' }}
        >
          <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
          {spinning ? 'Spinning...' : `SPIN · $${bet}`}
        </button>
      </main>
    </div>
  );
}