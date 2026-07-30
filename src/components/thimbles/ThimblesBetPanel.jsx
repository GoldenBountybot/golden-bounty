import React from 'react';
import { Minus, Plus, ChevronsRight } from 'lucide-react';

const BET_FRAME = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/29e26897b_generated_image.png';

export default function ThimblesBetPanel({ bet, MIN_BET, MAX_BET, BET_STEP, adjustBet, setBet }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full rounded-xl py-3 px-4 flex items-center justify-between"
        style={{
          backgroundImage: `url('${BET_FRAME}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 3px 10px rgba(0,0,0,0.55)',
        }}
      >
        <button
          onClick={() => adjustBet(-BET_STEP)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }}
        >
          <Minus className="w-5 h-5" style={{ color: '#e0d8c0' }} />
        </button>
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] tracking-widest" style={{ color: '#b0a890' }}>TOTAL BET</span>
          <span className="text-xl font-black tabular-nums" style={{ color: '#ffe8a0' }}>{bet.toFixed(2)} USDT</span>
        </div>
        <button
          onClick={() => adjustBet(BET_STEP)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }}
        >
          <Plus className="w-5 h-5" style={{ color: '#e0d8c0' }} />
        </button>
        <button
          onClick={() => setBet(MAX_BET)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }}
          title="Max"
        >
          <ChevronsRight className="w-5 h-5" style={{ color: '#e0d8c0' }} />
        </button>
      </div>
      <p className="text-center text-[11px]" style={{ color: '#8a8270' }}>MIN {MIN_BET} USDT - MAX {MAX_BET} USDT</p>
    </div>
  );
}