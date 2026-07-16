import React from 'react';
import { Zap, Minus, Plus, RotateCw, Play } from 'lucide-react';
import { BETS } from './symbols';

// Western-styled circular control button (wood + gold trim).
const woodBtn = (active) => ({
  background: active
    ? 'linear-gradient(145deg, #f3d77a, #c8932e 45%, #7a4f17 78%, #4a2f10)'
    : 'linear-gradient(145deg, #3a2a1a, #1c140c 60%, #2e2114)',
  border: '1px solid rgba(190,140,55,0.8)',
  boxShadow: active
    ? 'inset 0 1px 0 rgba(255,240,180,0.6), inset 0 -2px 3px rgba(0,0,0,0.4), 0 0 12px rgba(255,200,80,0.55)'
    : 'inset 0 1px 0 rgba(255,210,120,0.2), 0 0 0 1px rgba(46,30,12,0.6), 0 2px 4px rgba(0,0,0,0.65)',
});

// Engraved emboss so icons look carved into wood/gold (western metalwork).
const emboss = (onGold) => ({
  filter: onGold
    ? 'drop-shadow(0 1px 0 rgba(255,240,180,0.55)) drop-shadow(0 -1px 0 rgba(0,0,0,0.45))'
    : 'drop-shadow(0 1px 0 rgba(0,0,0,0.65)) drop-shadow(0 -1px 0 rgba(255,220,140,0.25))',
});

const Stud = ({ pos }) => (
  <span className={`absolute ${pos} w-1 h-1 rounded-full bg-amber-200 shadow-[0_0_3px_rgba(255,210,120,0.9)]`} />
);

function Medallion({ size, active, children }) {
  return (
    <span
      className={`relative ${size} rounded-full flex items-center justify-center transition-transform active:scale-95`}
      style={woodBtn(active)}
    >
      <Stud pos="top-0.5 left-0.5" />
      <Stud pos="top-0.5 right-0.5" />
      <Stud pos="bottom-0.5 left-0.5" />
      <Stud pos="bottom-0.5 right-0.5" />
      {children}
    </span>
  );
}

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
      <div className="flex items-center justify-between gap-2" style={{ fontFamily: 'Rye, Georgia, serif' }}>
        {/* Turbo */}
        <button onClick={() => setTurbo(t => !t)} className="flex flex-col items-center gap-0.5">
          <Medallion size="w-11 h-11" active={turbo}>
            <Zap
              className={`w-5 h-5 ${turbo ? 'text-stone-900' : 'text-amber-300/85'}`}
              fill={turbo ? 'currentColor' : 'none'}
              strokeWidth={2.4}
              style={emboss(turbo)}
            />
          </Medallion>
          <span className={`text-[9px] font-bold italic tracking-wide ${turbo ? 'text-yellow-300' : 'text-amber-200/60'}`}>TURBO</span>
        </button>

        {/* Bet down */}
        <button
          onClick={() => changeBet(-1)}
          disabled={spinning}
          className="disabled:opacity-40"
        >
          <Medallion size="w-10 h-10" active={false}>
            <Minus className="w-4 h-4 text-amber-300" strokeWidth={2.6} style={emboss(false)} />
          </Medallion>
        </button>

        {/* Spin — large gold medallion with western starburst */}
        <button onClick={spin} disabled={spinning} className="relative flex flex-col items-center gap-0.5 disabled:opacity-80">
          <span
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #f3d77a, #c8932e 45%, #7a4f17 75%, #4a2f10)',
              border: '2px solid rgba(46,30,12,0.85)',
              boxShadow: 'inset 0 2px 3px rgba(255,240,180,0.65), inset 0 -3px 5px rgba(0,0,0,0.45), 0 0 18px rgba(255,190,40,0.55), 0 4px 12px rgba(0,0,0,0.75)',
            }}
          >
            {/* western starburst rays behind icon */}
            <span
              className="absolute inset-1 rounded-full opacity-25"
              style={{ background: 'repeating-conic-gradient(from 0deg, #fff4d0 0deg 8deg, transparent 8deg 16deg)' }}
            />
            <Stud pos="top-0.5 left-0.5" />
            <Stud pos="top-0.5 right-0.5" />
            <Stud pos="bottom-0.5 left-0.5" />
            <Stud pos="bottom-0.5 right-0.5" />
            <RotateCw
              className={`relative w-8 h-8 text-stone-900 ${spinning ? 'animate-spin' : ''}`}
              strokeWidth={2.6}
              style={emboss(true)}
            />
          </span>
          <span className="text-[9px] font-black italic text-yellow-300 tracking-[0.2em]">SPIN</span>
        </button>

        {/* Bet up */}
        <button
          onClick={() => changeBet(1)}
          disabled={spinning}
          className="disabled:opacity-40"
        >
          <Medallion size="w-10 h-10" active={false}>
            <Plus className="w-4 h-4 text-amber-300" strokeWidth={2.6} style={emboss(false)} />
          </Medallion>
        </button>

        {/* Auto */}
        <button
          onClick={() => setAutoSpin(a => !a)}
          disabled={spinning && !autoSpin}
          className="flex flex-col items-center gap-0.5 disabled:opacity-60"
        >
          <Medallion size="w-11 h-11" active={autoSpin}>
            <Play
              className={`w-5 h-5 ${autoSpin ? 'text-stone-900' : 'text-amber-300/85'}`}
              fill={autoSpin ? 'currentColor' : 'none'}
              strokeWidth={2.4}
              style={emboss(autoSpin)}
            />
          </Medallion>
          <span className={`text-[9px] font-bold italic tracking-wide ${autoSpin ? 'text-yellow-300' : 'text-amber-200/60'}`}>AUTO</span>
        </button>
      </div>
    </div>
  );
}