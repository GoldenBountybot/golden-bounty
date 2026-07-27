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
      <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
        {/* Left group: Turbo + Minus */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={() => setTurbo(t => !t)} className="flex flex-col items-center gap-1">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={outline('#ffd700', turbo)}
            >
              <Zap
                className="w-4 h-4"
                style={{ color: '#ffd700' }}
                fill={turbo ? '#ffd700' : 'none'}
                strokeWidth={2.2}
              />
            </span>
            <span className="text-[8px] font-bold tracking-wide" style={{ color: '#ffd700' }}>TURBO</span>
          </button>

          <button onClick={() => changeBet(-1)} disabled={spinning} className="disabled:opacity-40">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                border: '1.5px solid rgba(197,160,89,0.9)',
                background: 'rgba(40,28,16,0.5)',
              }}
            >
              <Minus className="w-4 h-4" style={{ color: '#e8d8b8' }} strokeWidth={2.4} />
            </span>
          </button>
        </div>

        {/* Spin — absolutely centered wooden medallion */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <SpinButton spinning={spinning} onClick={spin} disabled={spinning} />
        </div>

        {/* Right group: Plus + Auto + Menu */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={() => changeBet(1)} disabled={spinning} className="disabled:opacity-40">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                border: '1.5px solid rgba(197,160,89,0.9)',
                background: 'rgba(40,28,16,0.5)',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: '#e8d8b8' }} strokeWidth={2.4} />
            </span>
          </button>

          <button
            onClick={() => setAutoSpin(a => !a)}
            disabled={spinning && !autoSpin}
            className="flex flex-col items-center gap-1 disabled:opacity-60"
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={outline('#4ade80', autoSpin)}
            >
              <Play
                className="w-4 h-4"
                style={{ color: autoSpin ? '#4ade80' : '#ffd700' }}
                fill="currentColor"
                strokeWidth={2.2}
              />
            </span>
            <span className="text-[8px] font-bold tracking-wide" style={{ color: autoSpin ? '#4ade80' : '#ffd700' }}>AUTO</span>
          </button>

          <Link to="/dashboard" className="flex flex-col items-center gap-1">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                border: '2px solid rgba(197,160,89,0.9)',
                background: 'rgba(40,28,16,0.5)',
              }}
            >
              <Menu className="w-4 h-4" style={{ color: '#ffffff' }} strokeWidth={2.6} />
            </span>
            <span className="text-[8px] font-bold tracking-wide" style={{ color: '#e8d8b8' }}>MENU</span>
          </Link>
        </div>
      </div>
    </div>
  );
}