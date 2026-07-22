import React, { useState } from 'react';
import { Info } from 'lucide-react';
import BigBrownSymbol from './BigBrownSymbol';
import BigBrownInfo from './BigBrownInfo';
import { useBigBrown } from './useBigBrown';

// Big Brown slot machine — 6x4 grid, 4096 ways, expanding wilds, free spins.
// Night-forest design matching the reference screenshots.
const FOREST_BG = 'radial-gradient(ellipse at 50% 20%, #1a3359 0%, #0a1a33 45%, #00122e 100%)';

export default function BigBrownMachine() {
  const [showInfo, setShowInfo] = useState(false);
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
    <div
      className="relative w-full max-w-2xl mx-auto pb-4 min-h-screen flex flex-col"
      style={{ background: FOREST_BG }}
    >
      {showInfo && <BigBrownInfo bet={bet} onClose={() => setShowInfo(false)} />}
      {/* Moon glow */}
      <div
        className="absolute top-8 right-8 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #c0d6e4 0%, rgba(192,214,228,0.3) 60%, transparent 100%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Info button */}
      <button
        onClick={() => setShowInfo(true)}
        className="absolute top-2 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(0,18,46,0.7)' }}
      >
        <Info className="w-4 h-4 text-amber-300" />
      </button>

      {/* Logo */}
      <div className="relative pt-3 pb-2 text-center">
        <h1
          className="text-3xl italic font-black tracking-wide"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom,#f5c542,#8b5a2b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          }}
        >
          BIG BROWN
        </h1>
        <p className="text-[9px] text-amber-200/50 italic tracking-[0.2em] mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
          🌲 🦌 🌲  4096 WAYS  🌲 🦌 🌲
        </p>
      </div>

      {/* Reel area — rustic wood frame */}
      <div className="relative px-2 flex-1 flex flex-col justify-center">
        <div
          className="relative rounded-[12px] p-2.5 overflow-hidden"
          style={{
            border: '3px solid #5a3a1a',
            background: 'linear-gradient(to bottom,#1a0f05,#0d0703)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 0 0 2px rgba(214,178,98,0.3), 0 6px 20px rgba(0,0,0,0.6)',
          }}
        >
          {anticipation && (
            <div className="absolute inset-0 z-10 pointer-events-none animate-pulse" style={{ boxShadow: 'inset 0 0 40px rgba(255,200,80,0.45)' }} />
          )}

          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {grid.map((reel, ri) => (
              <div key={ri} className="flex flex-col gap-1">
                {reel.map((sym, row) => {
                  const key = `${ri}-${row}`;
                  const stopped = stoppedReels.has(ri);
                  const isWin = winningPositions.has(key);
                  const isScatter = scatterPositions.has(key);
                  const expanded = expandedReels.has(ri) && (sym === 'brown' || sym === 'spirit');
                  return (
                    <div
                      key={key}
                      className="relative rounded-[5px] overflow-hidden"
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
              <h3 className="text-2xl italic font-black text-amber-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>FREE GAMES!</h3>
              <p className="text-sm text-amber-100/80 italic text-center px-6" style={{ fontFamily: 'Georgia, serif' }}>
                Expanding Wild guaranteed on every spin
              </p>
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
            <span className="text-xl italic font-black text-yellow-300 animate-pulse" style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 0 10px rgba(255,234,0,0.6)' }}>
              WIN ${lastWin.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative px-3 pb-1 mt-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* Bet minus */}
          <button
            onClick={() => setBetIndex(i => Math.max(0, i - 1))}
            disabled={spinning}
            className="w-9 h-9 rounded-full italic font-black text-amber-200 disabled:opacity-40 active:scale-95 flex items-center justify-center"
            style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.8)', fontFamily: 'Georgia, serif' }}
          >−</button>

          {/* Spin button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="relative w-16 h-16 rounded-full disabled:opacity-60 active:scale-95 transition-transform flex items-center justify-center"
            style={{
              background: spinning
                ? 'radial-gradient(circle,#6a4a1a,#3a2a10)'
                : 'radial-gradient(circle,#f5c542,#c8881e)',
              border: '2px solid rgba(255,234,120,0.85)',
              boxShadow: spinning ? 'none' : '0 0 16px rgba(255,210,80,0.6)',
            }}
          >
            <span className="text-2xl font-black text-[#2a1a06]" style={{ fontFamily: 'Rye, Georgia, serif' }}>
              {freeSpinsActive ? freeSpins : '▶'}
            </span>
          </button>

          {/* Bet plus */}
          <button
            onClick={() => setBetIndex(i => Math.min(4, i + 1))}
            disabled={spinning}
            className="w-9 h-9 rounded-full italic font-black text-amber-200 disabled:opacity-40 active:scale-95 flex items-center justify-center"
            style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.8)', fontFamily: 'Georgia, serif' }}
          >+</button>
        </div>

        {/* Turbo + Auto row */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            onClick={() => setTurbo(t => !t)}
            title="Turbo"
            className="w-8 h-8 rounded-full text-sm italic font-bold active:scale-95 flex items-center justify-center"
            style={{ border: `1px solid ${turbo ? 'rgba(255,234,120,0.9)' : 'rgba(214,178,98,0.4)'}`, background: turbo ? 'rgba(255,200,80,0.2)' : 'rgba(20,17,13,0.7)', color: turbo ? '#ffe9a8' : '#e8c878', fontFamily: 'Georgia, serif' }}
          >⚡</button>
          <button
            onClick={() => setAutoSpin(a => !a)}
            title="Auto"
            className="w-8 h-8 rounded-full text-sm italic font-bold active:scale-95 flex items-center justify-center"
            style={{ border: `1px solid ${autoSpin ? 'rgba(120,220,160,0.9)' : 'rgba(214,178,98,0.4)'}`, background: autoSpin ? 'rgba(60,200,120,0.2)' : 'rgba(20,17,13,0.7)', color: autoSpin ? '#bbf7d0' : '#e8c878', fontFamily: 'Georgia, serif' }}
          >↻</button>
        </div>
      </div>

      {/* Bottom info bar — matches screenshot layout */}
      <div
        className="relative mx-2 mb-2 rounded-[8px] px-3 py-2"
        style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(0,18,46,0.85)' }}
      >
        <div className="flex items-center justify-between text-[10px] text-white/70 italic mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          <span>BET</span>
          <span>WAYS</span>
          <span>BALANCE</span>
        </div>
        <div className="flex items-center justify-between text-xs font-black tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
          <span className="text-yellow-300">${bet.toFixed(2)}</span>
          <span className="text-white">{lastWin > 0 ? `$${lastWin.toFixed(2)}` : '4096'}</span>
          <span className="text-white">${balance.toFixed(2)}</span>
        </div>
        {freeSpinsActive && (
          <div className="text-center text-[10px] text-emerald-300 font-bold italic mt-1" style={{ fontFamily: 'Georgia, serif' }}>
            FREE GAMES · {freeSpins} LEFT
          </div>
        )}
      </div>
    </div>
  );
}