import React, { useState } from 'react';
import { Info, Zap, Plus, Repeat, DollarSign, Menu, Play } from 'lucide-react';
import BigBrownSymbol from './BigBrownSymbol';
import BigBrownInfo from './BigBrownInfo';
import { useBigBrown } from './useBigBrown';
import { WAYS, BETS, WILD_EXPAND_IMG, randomSymbol } from '@/lib/bigBrownEngine';

// Big Brown slot machine — 6x4 grid, 4096 ways, expanding wilds, free spins.
// Night-forest design matching the reference screenshot.
const FOREST_BG = 'radial-gradient(ellipse at 50% 15%, #0d2847 0%, #071a33 40%, #02091a 100%)';

// Spinning reel strip — a tall vertical column of random symbols that scrolls
// downward while a reel is spinning (Wild Bounty "showdown" style). The strip
// is 4 blocks tall where the last block equals the first, so the -75%→0%
// reelFall loop is seamless. Blurred for a motion feel.
const SpinStrip = React.memo(function SpinStrip({ reelIndex, turbo }) {
  const strip = React.useMemo(() => {
    const block = () => Array.from({ length: 4 }, () => randomSymbol(reelIndex));
    const b = block();
    return [...b, ...block(), ...block(), ...b];
  }, [reelIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[4px] pointer-events-none">
      <div
        className="flex flex-col gap-1 w-full"
        style={{
          animation: `reelFall ${turbo ? 0.28 : 0.42}s linear infinite`,
          filter: 'blur(1.5px) saturate(1.1)',
          willChange: 'transform',
        }}
      >
        {strip.map((s, i) => (
          <div key={i} className="rounded-[4px] overflow-hidden" style={{ aspectRatio: '3 / 4' }}>
            <BigBrownSymbol sym={s} />
          </div>
        ))}
      </div>
    </div>
  );
});

// Branch / gnarled wood frame styling.
const BRANCH_FRAME = `
  linear-gradient(135deg, #3a2614 0%, #1a0f06 30%, #2a1a0c 60%, #120a04 100%)
`;

export default function BigBrownMachine() {
  const [showInfo, setShowInfo] = useState(false);
  const [showBetMenu, setShowBetMenu] = useState(false);
  const g = useBigBrown();
  const {
    grid, balance, bet, betIndex, spinning, stoppedReels,
    lastWin, message, winningPositions, expandedReels, scatterPositions,
    freeSpins, turbo, autoSpin,
    showFreeSpinStart, freeSpinsActive, startFreeSpins,
    anticipation, bonusCost, buyBonus,
    spin, setBetIndex, setTurbo, setAutoSpin,
  } = g;

  const fmt = (v) => `$${v.toFixed(2)}`;

  return (
    <div
      className="relative w-full max-w-md mx-auto min-h-screen flex flex-col overflow-hidden"
      style={{ background: FOREST_BG }}
    >
      {showInfo && <BigBrownInfo bet={bet} onClose={() => setShowInfo(false)} />}

      {/* Ambient moon glow */}
      <div
        className="absolute top-6 right-6 w-16 h-16 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #c8dae8 0%, rgba(200,218,232,0.25) 60%, transparent 100%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Info button — top-left, large circular */}
      <button
        onClick={() => setShowInfo(true)}
        className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{
          border: '1.5px solid rgba(214,178,98,0.7)',
          background: 'radial-gradient(circle, rgba(20,30,55,0.9), rgba(5,12,28,0.95))',
          boxShadow: '0 0 8px rgba(214,178,98,0.25)',
        }}
      >
        <Info className="w-4 h-4 text-amber-300" />
      </button>

      {/* Title — BIG BROWN ornate gold */}
      <div className="relative pt-3 pb-1 text-center z-10">
        <h1
          className="text-2xl sm:text-3xl italic font-black tracking-wider leading-none"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom, #ffe9a8 0%, #f5c542 35%, #c8881e 70%, #8b5a2b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.9)) drop-shadow(0 0 6px rgba(214,178,98,0.3))',
          }}
        >
          BIG BROWN
        </h1>
        <p
          className="text-[8px] tracking-[0.35em] mt-1 italic"
          style={{ fontFamily: 'Georgia, serif', color: 'rgba(214,178,98,0.6)' }}
        >
          4096 WAYS
        </p>
      </div>

      {/* Reel area — gnarled branch frame */}
      <div className="relative px-3 flex-1 flex flex-col justify-center z-10">
        <div
          className="relative rounded-[10px] overflow-hidden"
          style={{
            padding: 6,
            background: BRANCH_FRAME,
            boxShadow: 'inset 0 0 0 2px rgba(90,58,26,0.6), inset 0 0 0 4px rgba(20,12,5,0.8), 0 4px 18px rgba(0,0,0,0.7)',
          }}
        >
          {/* Inner dark forest cavity */}
          <div
            className="relative rounded-[6px] overflow-hidden p-1.5"
            style={{
              background: 'linear-gradient(to bottom, #02060d, #050a14)',
              boxShadow: 'inset 0 0 24px rgba(0,0,0,0.9)',
            }}
          >
            {anticipation && (
              <div className="absolute inset-0 z-10 pointer-events-none animate-pulse" style={{ boxShadow: 'inset 0 0 40px rgba(255,200,80,0.5)' }} />
            )}

            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {grid.map((reel, ri) => {
                const reelExpanded = expandedReels.has(ri);
                const wildType = reelExpanded && reel[0] ? (reel[0] === 'spirit' ? 'spirit' : 'brown') : null;
                const stopped = stoppedReels.has(ri);
                return (
                  <div key={ri} className="relative">
                    <div
                      className="relative flex flex-col gap-1"
                      style={{
                        animation: stopped ? 'reelLand 0.4s ease-out' : 'none',
                        willChange: 'transform',
                      }}
                    >
                      {reel.map((sym, row) => {
                        const key = `${ri}-${row}`;
                        const isWin = winningPositions.has(key);
                        const isScatter = scatterPositions.has(key);
                        const expanded = reelExpanded && (sym === 'brown' || sym === 'spirit');
                        return (
                          <div
                            key={key}
                            className="relative rounded-[4px] overflow-hidden"
                            style={{ aspectRatio: '3 / 4' }}
                          >
                            {stopped ? (
                              <BigBrownSymbol sym={sym} highlight={isWin} expand={expanded} />
                            ) : (
                              <div className="w-full h-full" style={{ background: '#02060d' }} />
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
                    {!stopped && <SpinStrip reelIndex={ri} turbo={turbo} />}
                    {reelExpanded && (
                      <div
                        className="absolute inset-0 z-20 pointer-events-none rounded-[4px] overflow-hidden"
                        style={{
                          border: '2px solid rgba(255,234,120,0.85)',
                          boxShadow: '0 0 14px rgba(255,200,80,0.7), inset 0 0 10px rgba(255,210,90,0.5)',
                          animation: 'bbWildExpand 0.5s cubic-bezier(0.2,0.8,0.3,1.2) both',
                        }}
                      >
                        <img
                          src={WILD_EXPAND_IMG}
                          alt="WILD"
                          className="w-full h-full object-cover"
                          style={{
                            mixBlendMode: 'screen',
                            filter: 'drop-shadow(0 0 6px rgba(255,200,80,0.7)) brightness(1.1) saturate(1.1)',
                          }}
                          draggable={false}
                        />
                        {/* WILD label — 3D metallic gold serif (matches reference) */}
                        <span
                          className="absolute left-1/2 bottom-1 -translate-x-1/2 z-30 text-[16px] font-black italic tracking-[0.12em] leading-none select-none"
                          style={{
                            fontFamily: 'Rye, Georgia, serif',
                            background: 'linear-gradient(to bottom, #fff7d6 0%, #ffe9a8 18%, #f5c542 45%, #c8881e 72%, #8b5a2b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 1px 0 #6b4a1a) drop-shadow(0 2px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 9px rgba(255,200,80,0.8))',
                            WebkitTextStroke: '0.4px rgba(120,80,30,0.55)',
                          }}
                        >
                          WILD
                        </span>
                        {wildType === 'spirit' && (
                          <span
                            className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black italic"
                            style={{
                              background: 'linear-gradient(to bottom,#ffe9a8,#c8881e)',
                              color: '#3a2408',
                              fontFamily: 'Georgia, serif',
                              border: '1px solid rgba(255,255,255,0.6)',
                            }}
                          >
                            x2
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Free spin start overlay */}
            {showFreeSpinStart && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(3,5,10,0.9)', backdropFilter: 'blur(4px)' }}>
                <h3 className="text-2xl italic font-black text-amber-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>FREE GAMES!</h3>
                <p className="text-xs text-amber-100/80 italic text-center px-6" style={{ fontFamily: 'Georgia, serif' }}>
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

          {/* Win display — floats over grid */}
          {lastWin > 0 && !spinning && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,210,80,0.5)' }}>
              <span className="text-sm italic font-black text-yellow-300 animate-pulse" style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 0 8px rgba(255,234,0,0.7)' }}>
                WIN {fmt(lastWin)}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* BONUS POP badge — below the board */}
      <button
        onClick={buyBonus}
        disabled={spinning || freeSpins > 0 || balance < bonusCost}
        className="relative z-10 mx-auto mb-1 flex items-center gap-2 px-4 py-1.5 rounded-full disabled:opacity-40 active:scale-95 transition-transform"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #f5c542 40%, #c8881e 80%)',
          border: '2px solid rgba(255,234,160,0.9)',
          boxShadow: '0 0 12px rgba(255,200,80,0.45), inset 0 -3px 6px rgba(120,80,20,0.6)',
        }}
      >
        <span className="text-[10px] font-black italic leading-none text-[#3a2408] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>BONUS POP</span>
        <span className="text-[11px] font-black leading-none text-[#b8430a]" style={{ fontFamily: 'Georgia, serif' }}>{fmt(bonusCost)}</span>
      </button>

      {/* Bet menu popover */}
      {showBetMenu && (
        <div className="absolute bottom-24 left-3 z-40 rounded-[8px] py-1 px-1 flex flex-col gap-0.5" style={{ background: 'rgba(5,12,28,0.96)', border: '1px solid rgba(214,178,98,0.5)', boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <button
              key={i}
              onClick={() => { setBetIndex(i); setShowBetMenu(false); }}
              className={`px-3 py-1 rounded text-[11px] italic font-bold text-left ${i === betIndex ? 'text-yellow-300' : 'text-white/70'}`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {fmt(BETS[i])}
            </button>
          ))}
        </div>
      )}

      {/* Control panel */}
      <div className="relative px-3 pt-2 pb-1 z-10">
        <div className="flex items-center justify-between">
          {/* Left cluster: Turbo + Menu */}
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setTurbo(t => !t)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                border: `1.5px solid ${turbo ? 'rgba(255,234,120,0.9)' : 'rgba(214,178,98,0.45)'}`,
                background: turbo ? 'rgba(255,200,80,0.18)' : 'rgba(8,18,38,0.85)',
                boxShadow: turbo ? '0 0 10px rgba(255,200,80,0.4)' : 'none',
              }}
            >
              <Zap className={`w-4 h-4 ${turbo ? 'text-yellow-300' : 'text-amber-200/70'}`} fill={turbo ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setShowBetMenu(s => !s)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}
            >
              <Menu className="w-4 h-4 text-amber-200/70" />
            </button>
          </div>

          {/* Center: Large circular white spin button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="relative w-16 h-16 rounded-full disabled:opacity-70 active:scale-95 transition-transform flex items-center justify-center"
            style={{
              background: spinning
                ? 'radial-gradient(circle, #4a5a6a, #2a3a4a)'
                : 'radial-gradient(circle at 35% 30%, #ffffff, #e8edf2 60%, #c0c8d0 100%)',
              border: '2px solid rgba(255,255,255,0.5)',
              boxShadow: spinning ? 'none' : '0 0 16px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {freeSpinsActive ? (
              <span className="text-lg font-black text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>{freeSpins}</span>
            ) : (
              <Play className="w-6 h-6 text-slate-800" fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          {/* Right cluster: Plus + Autoplay + Currency */}
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setBetIndex(i => Math.min(4, i + 1))}
              disabled={spinning}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
              style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}
            >
              <Plus className="w-4 h-4 text-amber-200/70" />
            </button>
            <button
              onClick={() => setAutoSpin(a => !a)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                border: `1.5px solid ${autoSpin ? 'rgba(120,220,160,0.9)' : 'rgba(214,178,98,0.45)'}`,
                background: autoSpin ? 'rgba(60,200,120,0.18)' : 'rgba(8,18,38,0.85)',
                boxShadow: autoSpin ? '0 0 10px rgba(60,200,120,0.35)' : 'none',
              }}
            >
              <Repeat className={`w-4 h-4 ${autoSpin ? 'text-emerald-300' : 'text-amber-200/70'}`} />
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}
            >
              <DollarSign className="w-4 h-4 text-amber-200/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar — two rows per screenshot */}
      <div
        className="relative mx-2 mb-2 rounded-[8px] overflow-hidden z-10"
        style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(2,10,26,0.9)' }}
      >
        {/* Row 1: BET | LAST WIN | WAYS */}
        <div className="flex items-stretch text-center" style={{ borderBottom: '1px solid rgba(214,178,98,0.18)' }}>
          <div className="flex-1 py-1.5 px-1" style={{ borderRight: '1px solid rgba(214,178,98,0.18)' }}>
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>BET</div>
            <div className="text-[11px] font-black tabular-nums text-yellow-300" style={{ fontFamily: 'Georgia, serif' }}>{fmt(bet)}</div>
          </div>
          <div className="flex-1 py-1.5 px-1" style={{ borderRight: '1px solid rgba(214,178,98,0.18)' }}>
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>LAST WIN</div>
            <div className="text-[11px] font-black tabular-nums text-white" style={{ fontFamily: 'Georgia, serif' }}>{fmt(lastWin)}</div>
          </div>
          <div className="flex-1 py-1.5 px-1">
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>WAYS</div>
            <div className="text-[11px] font-black tabular-nums text-white" style={{ fontFamily: 'Georgia, serif' }}>{WAYS}</div>
          </div>
        </div>
        {/* Row 2: BALANCE | CURRENCY */}
        <div className="flex items-stretch text-center">
          <div className="flex-1 py-1.5 px-1" style={{ borderRight: '1px solid rgba(214,178,98,0.18)' }}>
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>BALANCE</div>
            <div className="text-[11px] font-black tabular-nums text-white" style={{ fontFamily: 'Georgia, serif' }}>{fmt(balance)}</div>
          </div>
          <div className="flex-1 py-1.5 px-1">
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>CURRENCY</div>
            <div className="text-[11px] font-black tabular-nums text-amber-300/80" style={{ fontFamily: 'Georgia, serif' }}>USD</div>
          </div>
        </div>

        {freeSpinsActive && (
          <div className="text-center text-[9px] text-emerald-300 font-bold italic py-0.5" style={{ fontFamily: 'Georgia, serif', borderTop: '1px solid rgba(214,178,98,0.18)' }}>
            FREE GAMES · {freeSpins} LEFT
          </div>
        )}
      </div>
    </div>
  );
}