import React, { useState, useRef, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

const ROWS = 9;          // 9 bounces → 10 buckets
const MULTS = [25, 5, 2, 1, 0.5, 0.5, 1, 2, 5, 25];
const BETS = [25, 50, 100, 250, 500];

export default function Plinko() {
  const { balance, setBalance, reset } = useCasinoBalance();
  const [betIdx, setBetIdx] = useState(1);
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState(null);
  const [resultBucket, setResultBucket] = useState(null);
  const [message, setMessage] = useState('Drop the ball!');
  const [lastWin, setLastWin] = useState(0);
  const timers = useRef([]);
  const bet = BETS[betIdx];

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const drop = () => {
    if (dropping) return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBalance(b => b - bet);
    setDropping(true);
    setResultBucket(null);
    setLastWin(0);
    setMessage('Dropping...');
    setBallPos(null);

    // simulate random bounces
    let col = 0;
    const path = [{ row: 0, col: 0 }];
    for (let r = 1; r <= ROWS; r++) {
      col += Math.random() < 0.5 ? 0 : 1;
      path.push({ row: r, col });
    }
    const bucket = col;

    let step = 0;
    const animate = () => {
      setBallPos(path[step]);
      if (step < path.length - 1) {
        const t = setTimeout(() => { step++; animate(); }, 130);
        timers.current.push(t);
      } else {
        const t = setTimeout(() => {
          const mult = MULTS[bucket];
          const win = bet * mult;
          if (win > 0) setBalance(b => b + win);
          setLastWin(win);
          setResultBucket(bucket);
          setMessage(`${mult}x · You won $${win.toFixed(2)}`);
          setDropping(false);
        }, 220);
        timers.current.push(t);
      }
    };
    animate();
  };

  const pos = (row, col) => ({
    left: `${((col + 0.5) / (row + 1)) * 100}%`,
    top: `${((row + 0.5) / (ROWS + 1)) * 84}%`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-950 via-stone-950 to-stone-950">
      <GameHeader title="Plinko Drop" accent="text-fuchsia-200" border="border-fuchsia-600/30" />

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        {/* Board */}
        <WesternFrame className="w-full p-4 flex flex-col items-center">
          <div className="relative w-full mx-auto" style={{ maxWidth: 320, aspectRatio: '3 / 4' }}>
            {/* pegs */}
            {Array.from({ length: ROWS + 1 }).map((_, r) =>
              Array.from({ length: r + 1 }).map((_, c) => (
                <span
                  key={`p-${r}-${c}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-amber-500/70"
                  style={{ ...pos(r, c), transform: 'translate(-50%,-50%)' }}
                />
              ))
            )}
            {/* ball */}
            {ballPos && (
              <span
                className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 shadow-[0_0_10px_rgba(255,200,0,0.9)] z-10"
                style={{ ...pos(ballPos.row, ballPos.col), transform: 'translate(-50%,-50%)', transition: 'left 0.13s linear, top 0.13s linear' }}
              />
            )}
            {/* buckets */}
            <div className="absolute inset-x-0 bottom-0 flex">
              {MULTS.map((m, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-[9px] font-black italic py-1 border-t border-amber-700/40 ${
                    resultBucket === i ? 'bg-amber-400 text-stone-900' : 'bg-stone-900/60 text-amber-200/70'
                  }`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {m}x
                </div>
              ))}
            </div>
          </div>
        </WesternFrame>

        <WesternFrame glow className="w-full text-center py-2">
          <span className="font-black italic text-base text-amber-300 px-2" style={{ fontFamily: 'Georgia, serif' }}>{message}</span>
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

        <div className="flex gap-2 flex-wrap justify-center">
          {BETS.map((b, i) => (
            <button
              key={b}
              disabled={dropping}
              onClick={() => setBetIdx(i)}
              className={`px-3 py-1.5 rounded-md text-sm font-bold italic border transition-colors ${betIdx === i ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'} disabled:opacity-50`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              ${b}
            </button>
          ))}
        </div>

        <button
          onClick={drop}
          disabled={dropping}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white text-lg font-black italic shadow-lg shadow-fuchsia-900/50 hover:from-fuchsia-400 hover:to-purple-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <RotateCw className="w-5 h-5" /> {dropping ? 'Dropping...' : `DROP · $${bet}`}
        </button>

        <button onClick={reset} className="text-[10px] italic text-amber-600/80 hover:text-amber-300 tracking-[0.2em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Reset Balance
        </button>
      </main>
    </div>
  );
}