import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import ShareButton from '@/components/ShareButton';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';

const SEGMENTS = [
  { mult: 0, label: '0', color: '#3a2810' },
  { mult: 2, label: '2x', color: '#b8862a' },
  { mult: 5, label: '5x', color: '#3a2810' },
  { mult: 1, label: '1x', color: '#b8862a' },
  { mult: 0, label: '0', color: '#3a2810' },
  { mult: 10, label: '10x', color: '#b8862a' },
  { mult: 3, label: '3x', color: '#3a2810' },
  { mult: 1, label: '1x', color: '#b8862a' },
];
const N = SEGMENTS.length;
const SEG = 360 / N;
const BETS = [25, 50, 100, 250, 500];

export default function LuckyWheel() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [betIdx, setBetIdx] = useState(1);
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('lucky-wheel');
  const [message, setMessage] = useState('Spin the Wheel!');
  const [lastWin, setLastWin] = useState(0);

  const bet = BETS[betIdx];

  const conic = `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')})`;

  const spin = () => {
    if (spinning) return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    setBalance(b => b - bet);
    setSpinning(true);
    setMessage('Spinning...');
    setLastWin(0);
    const winIdxs = SEGMENTS.map((_, i) => i).filter(i => SEGMENTS[i].mult > 0);
    const loseIdxs = SEGMENTS.map((_, i) => i).filter(i => SEGMENTS[i].mult === 0);
    const pool = Math.random() < (rtp / 100) ? winIdxs : loseIdxs;
    const idx = pool.length ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * N);
    const turns = 5 * 360;
    const finalRot = rotation - (rotation % 360) + turns + (360 - (idx * SEG + SEG / 2));
    setRotation(finalRot);
    setTimeout(() => {
      const mult = SEGMENTS[idx].mult;
      const win = bet * mult;
      if (win > 0) {
        setBalance(b => b + win);
        setLastWin(win);
        setMessage(`You won $${win.toFixed(2)}! (${mult}x)`);
      } else {
        setMessage('No win — try again!');
      }
      setSpinning(false);
    }, 4500);
  };

  const reset = () => { resetBalance(); setMessage('Balance reset'); setLastWin(0); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 via-stone-950 to-stone-950">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-rose-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-stone-300 hover:text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm italic tracking-wide">Lobby</span>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-rose-200" style={{ fontFamily: 'Georgia, serif' }}>Lucky Wheel</h1>
          </div>
          <ShareButton />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        {/* Wheel */}
        <div className="relative w-72 h-72">
          {/* pointer */}
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow" />
          <div className="absolute inset-0 rounded-full border-4 border-amber-600 shadow-[0_0_0_4px_#3a2810,0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden">
            <div
              className="w-full h-full rounded-full relative"
              style={{ background: conic, transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}
            >
              {SEGMENTS.map((s, i) => (
                <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}>
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm font-black italic text-white drop-shadow" style={{ fontFamily: 'Georgia, serif' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-700 border-2 border-stone-900 flex items-center justify-center">
            <RotateCw className="w-5 h-5 text-stone-900" />
          </div>
        </div>

        <WesternFrame glow className="w-full text-center py-2">
          <span className="font-black italic text-lg text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>{message}</span>
        </WesternFrame>

        <div className="grid grid-cols-3 gap-2 w-full">
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Balance</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${balance.toFixed(2)}</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Bet</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${bet}</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Last Win</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${lastWin.toFixed(2)}</span>
          </WesternFrame>
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
          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-700 text-white text-lg font-black italic shadow-lg shadow-rose-900/50 hover:from-rose-400 hover:to-red-600 disabled:opacity-60 transition-colors"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {spinning ? 'Spinning...' : `SPIN · $${bet}`}
        </button>

        <button onClick={reset} className="text-[10px] italic text-amber-600/80 hover:text-amber-300 tracking-[0.2em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Reset Balance
        </button>
      </main>
    </div>
  );
}