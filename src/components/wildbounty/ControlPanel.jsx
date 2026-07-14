import React from 'react';
import { Zap, Minus, Plus, Play, RotateCw } from 'lucide-react';
import { BETS } from './symbols';

export default function ControlPanel({ betIndex, setBetIndex, spinning, spin, turbo, setTurbo, autoSpin, setAutoSpin }) {
  const changeBet = (dir) => {
    if (spinning) return;
    setBetIndex(i => Math.max(0, Math.min(BETS.length - 1, i + dir)));
  };

  return (
    <div className="bg-gradient-to-b from-emerald-950 to-emerald-950/80 border-t-2 border-amber-800/40 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Turbo */}
        <button
          onClick={() => setTurbo(t => !t)}
          className={`flex flex-col items-center gap-0.5 ${turbo ? 'text-yellow-400' : 'text-stone-400'}`}
        >
          <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${turbo ? 'border-yellow-400 bg-yellow-400/10' : 'border-stone-600 bg-stone-800/60'}`}>
            <Zap className="w-5 h-5" fill={turbo ? 'currentColor' : 'none'} />
          </span>
          <span className="text-[9px] font-bold tracking-wide">TURBO</span>
        </button>

        {/* Bet down */}
        <button
          onClick={() => changeBet(-1)}
          disabled={spinning}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-800/70 border border-yellow-500/40 text-yellow-400 disabled:opacity-40"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Spin */}
        <button
          onClick={spin}
          disabled={spinning}
          className="relative w-16 h-16 rounded-full bg-gradient-to-b from-amber-700 via-amber-900 to-stone-900 border-4 border-amber-600/60 shadow-[0_0_14px_rgba(255,180,0,0.4)] flex items-center justify-center disabled:opacity-80 active:scale-95 transition-transform"
        >
          <RotateCw className={`w-7 h-7 text-amber-200 ${spinning ? 'animate-spin' : ''}`} />
          <span className="absolute -bottom-5 text-[9px] font-bold text-amber-200/80 tracking-widest">SPIN</span>
        </button>

        {/* Bet up */}
        <button
          onClick={() => changeBet(1)}
          disabled={spinning}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-800/70 border border-yellow-500/40 text-yellow-400 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Auto + menu */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setAutoSpin(a => !a)}
            disabled={spinning && !autoSpin}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${autoSpin ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-stone-600 bg-stone-800/60 text-stone-400'}`}
          >
            <Play className="w-4 h-4" fill={autoSpin ? 'currentColor' : 'none'} />
          </button>
          <span className="text-[9px] font-bold text-stone-400 tracking-wide">AUTO</span>
        </div>
      </div>
    </div>
  );
}