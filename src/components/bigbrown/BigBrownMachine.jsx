import React from 'react';
import BigBrownSymbol from './BigBrownSymbol';
import { useBigBrown } from './useBigBrown';

// Big Brown slot machine — 6x4 grid, 4096 ways, expanding wilds, free spins.
export default function BigBrownMachine() {
  const g = useBigBrown();
  const {
    grid, balance, bet, betIndex, spinning, stoppedReels,
    lastWin, message, winningPositions, expandedReels, scatterPositions,
    freeSpins, turbo, autoSpin,
    showFreeSpinStart, freeSpinsActive, startFreeSpins,
    anticipation,
    spin, setBetIndex, setTurbo, setAutoSpin,
  } = g;

  return (
    <div className="relative w-full max-w-5xl mx-auto px-2 pb-4">
      {/* Top status strip */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-[8px]"
        style={{ border: '1px solid rgba(214,178,98,0.4)', background: 'rgba(16,12,7,0.82)' }}
      >
        <span className="text-[11px] italic font-bold text-amber-200/80" style={{ fontFamily: 'Georgia, serif' }}>
          {freeSpinsActive ? `FREE GAMES · ${freeSpins} LEFT` : '4096 WAYS'}
        </span>
        <span className="text-xs italic font-black text-amber-300 text-center flex-1 truncate" style={{ fontFamily: 'Rye, Georgia, serif' }}>
          {message}
        </span>
        <span className="text-[11px] italic font-bold text-emerald-300 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
          ${balance.toFixed(2)}
        </span>
      </div>

      {/* Reel area */}
      <div
        className="relative rounded-[10px] p-2 overflow-hidden"
        style={{
          border: '1px solid rgba(214,178,98,0.55)',
          background: 'radial-gradient(circle at 50% 30%, rgba(40,32,18,0.9), rgba(8,6,4,0.96))',
          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.7), 0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        {anticipation && (
          <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ boxShadow: 'inset 0 0 30px rgba(255,200,80,0.4)' }} />
        )}

        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {grid.map((reel, ri) => (
            <div key={ri} className="flex flex-col gap-1.5">
              {reel.map((sym, row) => {
                const key = `${ri}-${row}`;
                const stopped = stoppedReels.has(ri);
                const isWin = winningPositions.has(key);
                const isScatter = scatterPositions.has(key);
                const expanded = expandedReels.has(ri) && (sym === 'brown' || sym === 'spirit');
                return (
                  <div
                    key={key}
                    className="relative rounded-[6px] overflow-hidden"
                    style={{
                      aspectRatio: '3 / 4',
                      transform: stopped ? 'translateY(0)' : 'translateY(-8%)',
                      transition: `transform 0.18s ease-out${stopped ? '' : ' 0s'}`,
                    }}
                  >
                    {stopped ? (
                      <BigBrownSymbol sym={sym} highlight={isWin} expand={expanded} />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl opacity-40"
                        style={{ background: 'linear-gradient(160deg,#1a140a,#0a0703)', filter: 'blur(1px)' }}
                      >
                        <span className="animate-pulse">🌲</span>
                      </div>
                    )}
                    {isScatter && (
                      <span
                        className="absolute inset-0 pointer-events-none animate-pulse"
                        style={{ boxShadow: 'inset 0 0 12px rgba(255,170,40,0.7)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Free spin start overlay */}
        {showFreeSpinStart && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(6,5,3,0.88)', backdropFilter: 'blur(4px)' }}>
            <div className="text-4xl animate-bounce">🐻‍❄️</div>
            <h3 className="text-2xl italic font-black text-amber-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>FREE GAMES!</h3>
            <p className="text-sm text-amber-100/80 italic" style={{ fontFamily: 'Georgia, serif' }}>Expanding Wild guaranteed on every spin</p>
            <button
              onClick={startFreeSpins}
              className="px-6 py-2 rounded-[8px] italic font-black text-[#2a1a06] active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', fontFamily: 'Georgia, serif', border: '1px solid rgba(214,178,98,0.8)' }}
            >
              START
            </button>
          </div>
        )}
      </div>

      {/* Win display */}
      {lastWin > 0 && (
        <div className="mt-2 text-center">
          <span className="text-lg italic font-black text-amber-300 animate-pulse" style={{ fontFamily: 'Rye, Georgia, serif' }}>
            WIN ${lastWin.toFixed(2)}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBetIndex(i => Math.max(0, i - 1))}
            disabled={spinning}
            className="w-8 h-8 rounded-[6px] italic font-black text-amber-200 disabled:opacity-40 active:scale-95"
            style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.7)', fontFamily: 'Georgia, serif' }}
          >−</button>
          <div className="px-2 py-1 rounded-[6px] text-center min-w-[72px]" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.7)' }}>
            <span className="text-[9px] block text-amber-100/60 italic" style={{ fontFamily: 'Georgia, serif' }}>BET</span>
            <span className="text-sm font-black italic text-amber-200 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bet.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setBetIndex(i => Math.min(4, i + 1))}
            disabled={spinning}
            className="w-8 h-8 rounded-[6px] italic font-black text-amber-200 disabled:opacity-40 active:scale-95"
            style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.7)', fontFamily: 'Georgia, serif' }}
          >+</button>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="flex-1 max-w-[220px] py-3 rounded-[10px] italic font-black text-[#2a1a06] text-lg disabled:opacity-50 active:scale-95 transition-transform"
          style={{ background: spinning ? 'rgba(120,90,40,0.4)' : 'linear-gradient(to bottom,#f5c542,#c8881e)', border: '1px solid rgba(214,178,98,0.85)', fontFamily: 'Rye, Georgia, serif' }}
        >
          {freeSpinsActive ? `FREE ${freeSpins}` : 'SPIN'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTurbo(t => !t)}
            title="Turbo"
            className="w-8 h-8 rounded-[6px] text-xs italic font-bold active:scale-95"
            style={{ border: `1px solid ${turbo ? 'rgba(255,220,120,0.9)' : 'rgba(214,178,98,0.4)'}`, background: turbo ? 'rgba(255,200,80,0.2)' : 'rgba(20,17,13,0.7)', color: turbo ? '#ffe9a8' : '#e8c878', fontFamily: 'Georgia, serif' }}
          >⚡</button>
          <button
            onClick={() => setAutoSpin(a => !a)}
            title="Auto"
            className="w-8 h-8 rounded-[6px] text-xs italic font-bold active:scale-95"
            style={{ border: `1px solid ${autoSpin ? 'rgba(120,220,160,0.9)' : 'rgba(214,178,98,0.4)'}`, background: autoSpin ? 'rgba(60,200,120,0.2)' : 'rgba(20,17,13,0.7)', color: autoSpin ? '#bbf7d0' : '#e8c878', fontFamily: 'Georgia, serif' }}
          >↻</button>
        </div>
      </div>

    </div>
  );
}