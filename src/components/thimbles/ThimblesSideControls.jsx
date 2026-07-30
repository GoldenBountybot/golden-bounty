import React from 'react';
import { Play, RotateCw, FastForward, Trash2, History, BarChart3, Info } from 'lucide-react';

const btnBase = 'flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 px-1 transition-transform active:scale-95';
const goldBorder = '2px solid #c5a059';
const goldShadow = '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,120,0.3)';
const goldText = { color: '#ffe8a0' };

export default function ThimblesSideControls({ onSpin, onBetMax, onClearBet, phase }) {
  const spinDisabled = phase !== 'idle' && phase !== 'over';
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        <button onClick={onSpin} disabled={spinDisabled} className={btnBase} style={{ background: 'linear-gradient(to bottom, #1b4d3e, #0e3524)', border: goldBorder, boxShadow: goldShadow, opacity: spinDisabled ? 0.5 : 1 }}>
          <Play className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>SPIN</span>
        </button>
        <button className={btnBase} style={{ background: 'linear-gradient(to bottom, #1a3a6e, #0e2548)', border: goldBorder, boxShadow: goldShadow }}>
          <RotateCw className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>AUTO</span>
        </button>
        <button onClick={onBetMax} className={btnBase} style={{ background: 'linear-gradient(to bottom, #601a2d, #3a0f1c)', border: goldBorder, boxShadow: goldShadow }}>
          <FastForward className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>MAX</span>
        </button>
        <button onClick={onClearBet} className={btnBase} style={{ background: 'linear-gradient(to bottom, #4b2d16, #2a1a0d)', border: goldBorder, boxShadow: goldShadow }}>
          <Trash2 className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>CLEAR</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button className={btnBase} style={{ background: 'linear-gradient(to bottom, #4b2d16, #2a1a0d)', border: goldBorder, boxShadow: goldShadow }}>
          <History className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>HISTORY</span>
        </button>
        <button className={btnBase} style={{ background: 'linear-gradient(to bottom, #4b2d16, #2a1a0d)', border: goldBorder, boxShadow: goldShadow }}>
          <BarChart3 className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>STATS</span>
        </button>
        <button className={btnBase} style={{ background: 'linear-gradient(to bottom, #4b2d16, #2a1a0d)', border: goldBorder, boxShadow: goldShadow }}>
          <Info className="w-4 h-4" style={goldText} />
          <span className="text-[9px] font-black tracking-wider" style={goldText}>RULES</span>
        </button>
      </div>
    </div>
  );
}