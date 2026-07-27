import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Minus, Plus, Play, Menu } from 'lucide-react';
import { BETS } from './symbols';
import SpinButton from './SpinButton';

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
      <div className="flex items-center justify-center gap-4 sm:gap-6">
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

        {/* Spin — wooden medallion with gold chasing arrows (rotates + glows on click) */}
        <SpinButton spinning={spinning} onClick={spin} disabled={spinning} />

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

        {/* Menu — bottom-right hamburger icon */}
        <Link to="/dashboard" className="flex flex-col items-center gap-1 ml-1">
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              border: '2px solid rgba(197,160,89,0.9)',
              background: 'rgba(40,28,16,0.5)',
            }}
          >
            <Menu className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.6} />
          </span>
          <span className="text-[9px] font-bold tracking-wide" style={{ color: '#e8d8b8' }}>MENU</span>
        </Link>
      </div>
    </div>
  );
}