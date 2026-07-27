import React from 'react';
import { Zap, Minus, Plus, Play, RotateCw } from 'lucide-react';
import { BETS } from './symbols';

// Control bar matching the reference:
//  - Turbo / Auto : thin circular outlines with coloured icon + label
//  - Minus / Plus : thin gold circular outlines
//  - Spin         : large wood-grain circle with white/silver arrows
export default function ControlPanel({ betIndex, setBetIndex, spinning, spin, turbo, setTurbo, autoSpin, setAutoSpin }) {
  const changeBet = (dir) => {
    if (spinning) return;
    setBetIndex(i => Math.max(0, Math.min(BETS.length - 1, i + dir)));
  };

  const outline = (color, glow) => ({
    border: `2px solid ${color}`,
    background: glow ? `${color}1f` : 'transparent',
    boxShadow: glow ? `0 0 10px ${color}80` : 'none',
  });

  return (
    <div className="px-3 py-3">
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        {/* Turbo */}
        <button onClick={() => setTurbo(t => !t)} className="flex flex-col items-center gap-1">
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={outline('#ffd700', turbo)}
          >
            <Zap
              className="w-5 h-5"
              style={{ color: '#ffd700' }}
              fill={turbo ? '#ffd700' : 'none'}
              strokeWidth={2.2}
            />
          </span>
          <span className="text-[9px] font-bold tracking-wide" style={{ color: '#ffd700' }}>TURBO</span>
        </button>

        {/* Bet down */}
        <button onClick={() => changeBet(-1)} disabled={spinning} className="disabled:opacity-40">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              border: '1.5px solid rgba(197,160,89,0.9)',
              background: 'rgba(40,28,16,0.5)',
            }}
          >
            <Minus className="w-5 h-5" style={{ color: '#e8d8b8' }} strokeWidth={2.4} />
          </span>
        </button>

        {/* Spin — large wood-grain circle with interlocking arrows */}
        <button onClick={spin} disabled={spinning} className="relative flex items-center justify-center disabled:opacity-90">
          <span
            className="w-20 h-20 rounded-full flex items-center justify-center relative transition-transform active:scale-95"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #7F5E40 0%, #4B3621 55%, #2E1B0E 100%)',
              border: '3px solid rgba(197,160,89,0.85)',
              boxShadow:
                'inset 0 2px 4px rgba(255,220,140,0.25), inset 0 -4px 8px rgba(0,0,0,0.6), 0 0 18px rgba(255,180,40,0.4), 0 4px 12px rgba(0,0,0,0.7)',
            }}
          >
            {/* faint embossed bull-skull in the center of the wood */}
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                opacity: 0.09,
                backgroundImage:
                  'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c970620bf_file_0000000037f88207a4992e01551e3e21.png)',
                backgroundSize: '58%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <RotateCw
              className={`w-9 h-9 relative ${spinning ? 'animate-spin' : ''}`}
              style={{ color: '#f2f2f2', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))' }}
              strokeWidth={2.6}
            />
          </span>
        </button>

        {/* Bet up */}
        <button onClick={() => changeBet(1)} disabled={spinning} className="disabled:opacity-40">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              border: '1.5px solid rgba(197,160,89,0.9)',
              background: 'rgba(40,28,16,0.5)',
            }}
          >
            <Plus className="w-5 h-5" style={{ color: '#e8d8b8' }} strokeWidth={2.4} />
          </span>
        </button>

        {/* Auto */}
        <button
          onClick={() => setAutoSpin(a => !a)}
          disabled={spinning && !autoSpin}
          className="flex flex-col items-center gap-1 disabled:opacity-60"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={outline('#4ade80', autoSpin)}
          >
            <Play
              className="w-5 h-5"
              style={{ color: autoSpin ? '#4ade80' : '#ffd700' }}
              fill="currentColor"
              strokeWidth={2.2}
            />
          </span>
          <span className="text-[9px] font-bold tracking-wide" style={{ color: autoSpin ? '#4ade80' : '#ffd700' }}>AUTO</span>
        </button>
      </div>
    </div>
  );
}