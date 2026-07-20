import React, { useState, useEffect, useRef } from 'react';
import { Crown, X } from 'lucide-react';
import { ROYAL_COIN_IMG, GOLD_COIN_IMG, JACKPOT_COINS } from '@/lib/crownCoinsEngine';

// Royal Treasury hold-and-win bonus. Auto-plays the pre-simulated `spins`,
// revealing coins on the 3x3 grid, tracking attempts (3, reset on any new coin)
// and a running total. When the round ends, shows Collect.
export default function RoyalTreasuryBonus({ spins, total, bet, onCollect }) {
  const initial = () => {
    const g = Array(9).fill(null);
    g[1] = g[4] = g[7] = { type: 'royal' };
    return g;
  };
  const [grid, setGrid] = useState(initial);
  const [attempts, setAttempts] = useState(3);
  const [running, setRunning] = useState(0);
  const [done, setDone] = useState(false);
  const [fresh, setFresh] = useState([]); // cells that just landed (for pop)
  const timers = useRef([]);

  useEffect(() => {
    let step = 0;
    const tick = () => {
      if (step >= spins.length) { setDone(true); return; }
      const spin = spins[step];
      const landed = spin.landings.map(l => l.cell);
      setGrid(prev => {
        const next = [...prev];
        spin.landings.forEach(l => { next[l.cell] = l; });
        return next;
      });
      setFresh(landed);
      const t = setTimeout(() => {
        setAttempts(spin.attemptsAfter);
        setRunning(spin.runningTotal);
        setFresh([]);
        step++;
        tick();
      }, 850);
      timers.current.push(t);
    };
    const t0 = setTimeout(tick, 500);
    timers.current.push(t0);
    return () => timers.current.forEach(t => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCell = (cell, i) => {
    if (!cell) {
      return <div className="aspect-square rounded-md" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(212,175,55,0.2)' }} />;
    }
    const pop = fresh.includes(i);
    const anim = pop ? 'ccReelLand 0.45s ease-out' : 'none';
    if (cell.type === 'royal') {
      return (
        <div className="aspect-square rounded-md flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#2a0608,#140204)', border: '2px solid #d4af37', boxShadow: '0 0 10px rgba(255,200,80,0.5)', animation: anim }}>
          <img src={ROYAL_COIN_IMG} alt="royal" className="w-[78%] h-[78%] object-contain" style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 6px rgba(255,210,80,0.8))' }} />
        </div>
      );
    }
    if (cell.type === 'jackpot') {
      return (
        <div className="aspect-square rounded-md flex flex-col items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#7a0e1c,#2a0408)', border: '2px solid #ffd24a', boxShadow: '0 0 14px rgba(255,210,80,0.85)', animation: anim }}>
          <img src={JACKPOT_COINS[cell.tier]} alt={cell.tier} className="w-[72%] h-[72%] object-contain" style={{ mixBlendMode: 'screen' }} />
          <span className="text-[9px] font-black text-yellow-300 -mt-1" style={{ fontFamily: 'Rye, Georgia, serif' }}>{cell.tier}</span>
        </div>
      );
    }
    // gold
    return (
      <div className="aspect-square rounded-md flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#4a3416,#211608)', border: '2px solid #d4af37', boxShadow: '0 0 8px rgba(255,210,80,0.5)', animation: anim }}>
        <img src={GOLD_COIN_IMG} alt="gold" className="w-[78%] h-[78%] object-contain" style={{ mixBlendMode: 'screen' }} />
        <span className="absolute font-black text-yellow-100" style={{ fontSize: '12px', textShadow: '0 1px 2px #000, 0 0 3px rgba(0,0,0,0.85)', fontFamily: 'Georgia, serif' }}>{(cell.mult * bet).toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-amber-300" />
          <h3 className="text-lg font-black text-yellow-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>Royal Treasury</h3>
          <Crown className="w-5 h-5 text-amber-300" />
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-yellow-300/70 font-bold tracking-wider">ATTEMPTS</span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full" style={{ background: i < attempts ? '#ffd24a' : 'rgba(255,255,255,0.2)', boxShadow: i < attempts ? '0 0 6px rgba(255,210,80,0.8)' : 'none' }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-yellow-300/70 font-bold tracking-wider">TOTAL</span>
            <span className="text-base font-black text-emerald-300 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${running.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {grid.map((c, i) => (<div key={i}>{renderCell(c, i)}</div>))}
        </div>

        <p className="mt-3 text-center text-[10px] text-yellow-200/70 italic">{done ? 'Treasury sealed' : 'Collecting coins…'}</p>

        {done && (
          <button onClick={() => onCollect(total)} className="mt-2 w-full py-2 rounded-lg text-stone-950 font-black italic" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)' }}>
            Collect ${total.toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );
}