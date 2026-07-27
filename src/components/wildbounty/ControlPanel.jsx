import React from 'react';
import { Zap, Minus, Plus, RotateCw, Play, Menu, Wallet, Coins, Trophy } from 'lucide-react';
import { BETS } from './symbols';

const WESTERN = { fontFamily: "'Rye','Smokum',Georgia,serif" };

// Chocolate wood plank texture (matches the board)
const CHOC_WOOD = {
  backgroundColor: '#3D2B1F',
  backgroundImage: [
    'repeating-linear-gradient(180deg, rgba(0,0,0,0.24) 0px, rgba(0,0,0,0.24) 2px, transparent 2px, transparent 40px)',
    'linear-gradient(180deg, #4a3424, #3D2B1F 40%, #2a1c12)',
  ].join(', '),
};

// Yellow circular control (turbo/auto/bet)
function YellowRound({ active, children, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-0.5 disabled:opacity-50">
      <span
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
        style={{
          background: active
            ? 'radial-gradient(circle at 35% 30%, #ffe98a, #FFD700 50%, #c9a400)'
            : 'radial-gradient(circle at 35% 30%, #f0c850, #c8932e 55%, #8a6010)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.6)',
          border: '1px solid #6b4a18',
        }}
      >
        {children}
      </span>
      {label && (
        <span className="text-[8px] font-black italic tracking-wider text-amber-200" style={WESTERN}>
          {label}
        </span>
      )}
    </button>
  );
}

// Quick stat chip inside the translucent container
function StatChip({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="w-3.5 h-3.5 text-yellow-400" strokeWidth={2.4} />
      <span className="text-[10px] font-bold italic tabular-nums text-amber-100" style={WESTERN}>
        {value}
      </span>
    </div>
  );
}

export default function ControlPanel({ balance, bet, win, betIndex, setBetIndex, spinning, spin, turbo, setTurbo, autoSpin, setAutoSpin }) {
  const changeBet = (dir) => {
    if (spinning) return;
    setBetIndex((i) => Math.max(0, Math.min(BETS.length - 1, i + dir)));
  };

  return (
    <div className="relative px-2 py-2 mt-1" style={{ ...CHOC_WOOD, borderRadius: 10, boxShadow: '0 0 0 2px #2a1c12, 0 0 0 3px #C5A059, 0 4px 12px rgba(0,0,0,0.65)' }}>
      <div className="flex items-center justify-between gap-1.5">
        {/* Quick menu — translucent container with wallet / coins / trophy */}
        <div
          className="flex flex-col gap-0.5 px-1.5 py-1 rounded-md"
          style={{ background: 'rgba(20,14,8,0.55)', border: '1px solid rgba(197,160,89,0.4)' }}
        >
          <StatChip icon={Wallet} value={`$${balance.toFixed(2)}`} />
          <StatChip icon={Coins} value={`$${bet.toFixed(2)}`} />
          <StatChip icon={Trophy} value={`$${win.toFixed(2)}`} />
        </div>

        {/* Turbo */}
        <YellowRound active={turbo} onClick={() => setTurbo((t) => !t)} label="TURBO">
          <Zap className="w-4 h-4 text-stone-900" fill={turbo ? 'currentColor' : 'none'} strokeWidth={2.4} />
        </YellowRound>

        {/* Bet down */}
        <YellowRound onClick={() => changeBet(-1)} disabled={spinning}>
          <Minus className="w-4 h-4 text-stone-900" strokeWidth={3} />
        </YellowRound>

        {/* Spin — large wooden button with gold curved arrows */}
        <button onClick={spin} disabled={spinning} className="flex flex-col items-center disabled:opacity-80">
          <span
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              ...CHOC_WOOD,
              boxShadow: '0 0 0 2px #2a1c12, 0 0 0 4px #C5A059, 0 0 0 5px #2a1c12, inset 0 2px 4px rgba(255,210,150,0.15), 0 4px 12px rgba(0,0,0,0.7)',
            }}
          >
            <RotateCw className={`w-8 h-8 text-amber-300 ${spinning ? 'animate-spin' : ''}`} strokeWidth={2.6} style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.6))' }} />
          </span>
        </button>

        {/* Bet up */}
        <YellowRound onClick={() => changeBet(1)} disabled={spinning}>
          <Plus className="w-4 h-4 text-stone-900" strokeWidth={3} />
        </YellowRound>

        {/* Auto */}
        <YellowRound active={autoSpin} onClick={() => setAutoSpin((a) => !a)} disabled={spinning && !autoSpin} label="AUTO">
          <Play className="w-4 h-4 text-stone-900" fill={autoSpin ? 'currentColor' : 'none'} strokeWidth={2.4} />
        </YellowRound>

        {/* Menu */}
        <button className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'rgba(20,14,8,0.55)', border: '1px solid rgba(197,160,89,0.4)' }}>
          <Menu className="w-5 h-5 text-amber-300" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}