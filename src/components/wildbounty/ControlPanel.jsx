import React from 'react';
import { Zap, Minus, Plus, RotateCw, Play } from 'lucide-react';
import { BETS } from './symbols';

// Western-styled circular control button (wood + gold trim).
const woodBtn = (active) => ({
  background: active
    ? 'linear-gradient(145deg, #e0b34a, #7a4f17 60%, #c8932e)'
    : 'linear-gradient(145deg, #3a2a1a, #1c140c 60%, #2e2114)',
  border: '1px solid rgba(190,140,55,0.8)',
  boxShadow: active
    ? 'inset 0 1px 0 rgba(255,230,160,0.5), 0 0 10px rgba(255,200,80,0.5)'
    : 'inset 0 1px 0 rgba(255,210,120,0.2), 0 2px 4px rgba(0,0,0,0.6)',
});

export default function ControlPanel({ betIndex, setBetIndex, spinning, spin, turbo, setTurbo, autoSpin, setAutoSpin }) {
  const changeBet = (dir) => {
    if (spinning) return;
    setBetIndex(i => Math.max(0, Math.min(BETS.length - 1, i + dir)));
  };

  return (
    <div
      className="px-3 py-3 border-t"
      style={{
        background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))',
        borderTop: '1px solid rgba(190,140,55,0.5)',
      }}
    >
      <div className="flex items-center justify-between gap-2" style={{ fontFamily: 'Georgia, serif' }}>
        {/* Turbo */}
        <button
          onClick={() => setTurbo(t => !t)}
          className="flex flex-col items-center gap-0.5"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={woodBtn(turbo)}
          >
            <Zap className={`w-5 h-5 ${turbo ? 'text-stone-900' : 'text-amber-300/80'}`} fill={turbo ? 'currentColor' : 'none'} strokeWidth={2.4} />
          </span>
          <span className={`text-[9px] font-bold italic tracking-wide ${turbo ? 'text-yellow-300' : 'text-amber-200/60'}`}>TURBO</span>
        </button>

        {/* Bet down */}
        <button
          onClick={() => changeBet(-1)}
          disabled={spinning}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
          style={woodBtn(false)}
        >
          <Minus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
        </button>

        {/* Spin — large gold medallion */}
        <button
          onClick={spin}
          disabled={spinning}
          className="relative flex flex-col items-center gap-0.5 disabled:opacity-80"
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #f3d77a, #c8932e 45%, #7a4f17 75%, #4a2f10)',
              border: '2px solid rgba(46,30,12,0.8)',
              boxShadow: 'inset 0 2px 3px rgba(255,240,180,0.6), inset 0 -3px 5px rgba(0,0,0,0.4), 0 0 16px rgba(255,190,40,0.5), 0 4px 10px rgba(0,0,0,0.7)',
            }}
          >
            <RotateCw className={`w-8 h-8 text-stone-900 ${spinning ? 'animate-spin' : ''}`} strokeWidth={2.6} />
          </span>
          <span className="text-[9px] font-black italic text-yellow-300 tracking-[0.2em]">SPIN</span>
        </button>

        {/* Bet up */}
        <button
          onClick={() => changeBet(1)}
          disabled={spinning}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
          style={woodBtn(false)}
        >
          <Plus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
        </button>

        {/* Auto */}
        <button
          onClick={() => setAutoSpin(a => !a)}
          disabled={spinning && !autoSpin}
          className="flex flex-col items-center gap-0.5 disabled:opacity-60"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={woodBtn(autoSpin)}
          >
            <Play className={`w-5 h-5 ${autoSpin ? 'text-stone-900' : 'text-amber-300/80'}`} fill={autoSpin ? 'currentColor' : 'none'} strokeWidth={2.4} />
          </span>
          <span className={`text-[9px] font-bold italic tracking-wide ${autoSpin ? 'text-yellow-300' : 'text-amber-200/60'}`}>AUTO</span>
        </button>
      </div>
    </div>
  );
}