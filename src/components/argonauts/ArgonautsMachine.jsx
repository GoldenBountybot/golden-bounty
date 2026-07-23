import React, { useState } from 'react';
import { Info, ArrowLeft, Zap, Menu, Plus, RotateCw, DollarSign, Play } from 'lucide-react';
import { useArgonauts } from './useArgonauts';
import { REELS, ROWS, BETS, FREE_SPINS_AWARD, SYMBOLS } from './argonautsEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import ArgoSymbolTile from './ArgoSymbolTile';
import WinLineOverlay from './WinLineOverlay';
import Meander from './Meander';
import ArgoOverlays from './ArgoOverlays';

const BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/cca28e846_generated_image.png';

// Spinning reel strip — tall vertical column of random symbols scrolling
// seamlessly (Big Brown style). 4 blocks, last = first for a seamless loop.
const ArgoSpinStrip = React.memo(function ArgoSpinStrip({ reelIndex, turbo }) {
  const strip = React.useMemo(() => {
    const ids = Object.keys(SYMBOLS);
    const block = () => Array.from({ length: ROWS }, () => ids[Math.floor(Math.random() * ids.length)]);
    const b = block();
    return [...b, ...block(), ...block(), ...b];
  }, [reelIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none">
      <div
        className="flex flex-col gap-1 w-full"
        style={{ animation: `reelFall ${turbo ? 0.4 : 0.6}s linear infinite`, willChange: 'transform' }}
      >
        {strip.map((s, i) => (
          <div key={i} className="rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
            <ArgoSymbolTile sym={s} />
          </div>
        ))}
      </div>
    </div>
  );
});

function IconButton({ onClick, active, disabled, children, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40"
      style={{
        width: 42,
        height: 42,
        border: `1.5px solid ${active ? '#FFD700' : 'rgba(255,255,255,0.35)'}`,
        background: active ? 'rgba(255,215,0,0.18)' : 'rgba(0,0,0,0.4)',
        color: active ? '#FFD700' : '#ffffff',
        boxShadow: active ? '0 0 10px rgba(255,215,0,0.5)' : 'none',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </button>
  );
}

export default function ArgonautsMachine() {
  const g = useArgonauts();
  const { balance } = useCasinoBalance();
  const [showPaytable, setShowPaytable] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const spinDisabled = g.spinning || g.freeSpinsActive || g.bonusActive || g.riskMode;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col text-white overflow-hidden"
      style={{ fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Coastal background */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,13,30,0.25), rgba(7,13,30,0.55))' }} />

      {/* Title row */}
      <header className="relative px-3 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRules(true)}
            title="Info"
            className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, border: '1.5px solid rgba(255,255,255,0.85)', color: '#fff', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
          >
            <Info className="w-4 h-4" />
          </button>

          <h1
            className="text-2xl sm:text-3xl tracking-[0.15em] font-black select-none"
            style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(to bottom, #FFD700 0%, #FF8C00 55%, #FF4500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              WebkitTextStroke: '1.2px #1a0d2a',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))',
            }}
          >
            ARGONAUTS
          </h1>

          <button
            onClick={() => { window.location.href = '/'; }}
            title="Lobby"
            className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, border: '1.5px solid rgba(255,255,255,0.85)', color: '#fff', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Greek meander border under the title */}
        <div className="mt-1.5 mx-auto" style={{ maxWidth: 360 }}>
          <Meander color="#FFD700" height={16} />
        </div>
      </header>

      {/* Reel grid */}
      <div className="relative flex-1 flex items-center justify-center px-3 py-2 mt-12">
        <div className="w-full max-w-md">
          {g.freeSpins > 0 && (
            <div className="flex justify-center mb-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-black tracking-wider animate-pulse"
                style={{ border: '1.5px solid #FFD700', background: 'rgba(255,215,0,0.2)', color: '#FFD700', boxShadow: '0 0 12px rgba(255,215,0,0.5)' }}
              >
                ⛵ {g.freeSpins} FREE SPINS
              </span>
            </div>
          )}

          <div
            className="relative grid gap-1 p-1.5 rounded-[10px]"
            style={{
              gridTemplateColumns: `repeat(${REELS}, 1fr)`,
              border: '2.5px solid #FFD700',
              boxShadow: '0 0 24px rgba(255,215,0,0.4), inset 0 0 22px rgba(0,0,0,0.6)',
              background: 'rgba(26,13,74,0.4)',
            }}
          >
            {g.grid.map((reel, ri) => {
              const stopped = g.spinningReels.has(ri);
              return (
                <div key={ri} className="relative flex flex-col gap-1">
                  {reel.map((sym, row) => {
                    const key = `${ri}-${row}`;
                    const isWin = g.winningPositions.has(key);
                    return (
                      <div key={key} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', opacity: stopped ? 1 : 0 }}>
                        {stopped ? (
                          <div className="w-full h-full" style={{ animation: `bbSymbolDrop 0.34s ease-out both` }}>
                            <ArgoSymbolTile sym={sym} win={isWin} dim={g.winningPositions.size > 0 && !isWin} />
                          </div>
                        ) : (
                          <div className="w-full h-full" style={{ background: 'rgba(12,8,30,0.92)' }} />
                        )}
                      </div>
                    );
                  })}
                  {!stopped && <ArgoSpinStrip reelIndex={ri} turbo={g.turbo} />}
                </div>
              );
            })}
            <WinLineOverlay winningPositions={g.winningPositions} />
          </div>

          {/* Status strip: free-game labels + message */}
          <div className="mt-2 relative">
            {g.freeSpins > 0 && (
              <div className="flex justify-between text-[10px] font-bold tracking-wide text-white" style={{ textShadow: '0 1px 2px #000' }}>
                <span>FREE SPIN PAYS ${g.bet.toFixed(2)}</span>
                <span>FREE GAME {FREE_SPINS_AWARD - g.freeSpins + 1} OF {FREE_SPINS_AWARD}</span>
              </div>
            )}
            <div className="text-center min-h-[18px]">
              <p className="text-xs font-bold tracking-wide text-amber-50" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{g.message}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="relative px-3 pb-2">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-2">
              <IconButton onClick={() => g.setTurbo(!g.turbo)} active={g.turbo} disabled={g.spinning} title="Turbo"><Zap className="w-5 h-5" /></IconButton>
              <IconButton onClick={() => setShowPaytable(true)} title="Menu"><Menu className="w-5 h-5" /></IconButton>
            </div>

            {/* Center: circular spin */}
            <div className="flex flex-col items-center">
              <button
                onClick={g.spin}
                disabled={spinDisabled}
                className="relative flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-70"
                style={{
                  width: 72,
                  height: 72,
                  background: 'radial-gradient(circle, rgba(255,215,0,0.18), rgba(0,0,0,0.55))',
                  border: '4px solid #FFD700',
                  boxShadow: '0 0 22px rgba(255,215,0,0.6), inset 0 0 14px rgba(255,215,0,0.3)',
                }}
              >
                {g.spinning ? (
                  <span className="block w-7 h-7 rounded-full border-[3px] border-white/30 border-t-white" style={{ animation: 'saSpinRotate 0.6s linear infinite' }} />
                ) : (
                  <Play className="w-7 h-7 text-white" fill="white" style={{ marginLeft: 3 }} />
                )}
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <IconButton onClick={() => g.setBetIndex(Math.min(g.betIndex + 1, BETS.length - 1))} disabled={g.spinning || g.betIndex >= BETS.length - 1} title="Increase bet"><Plus className="w-5 h-5" /></IconButton>
              <IconButton onClick={() => g.setAutoSpin(!g.autoSpin)} active={g.autoSpin} disabled={g.spinning} title="Auto spin"><RotateCw className="w-5 h-5" /></IconButton>
              <IconButton onClick={() => g.setBetIndex(Math.max(g.betIndex - 1, 0))} disabled={g.spinning || g.betIndex <= 0} title="Bet"><DollarSign className="w-5 h-5" /></IconButton>
            </div>
          </div>

          {/* Risk button when available */}
          {g.riskActive && !g.riskMode && (
            <button
              onClick={g.startRisk}
              className="mt-2 w-full py-1.5 rounded-[8px] text-xs font-black tracking-wider animate-pulse"
              style={{ border: '1.5px solid rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}
            >
              RISK ×2 — DOUBLE YOUR ${g.pendingWin.toFixed(2)}
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        className="relative px-4 py-2 mx-auto max-w-md w-full grid grid-cols-3 gap-2 text-center"
        style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,215,0,0.2)' }}
      >
        <div className="text-left">
          <p className="text-[9px] tracking-widest text-white/60">BET</p>
          <p className="text-sm font-bold tabular-nums">${g.bet.toFixed(2)}</p>
          <p className="text-[9px] tracking-widest text-white/60 mt-0.5">BALANCE</p>
          <p className="text-sm font-bold tabular-nums">${balance.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] tracking-widest text-white/60">LAST WIN</p>
          <p
            className="font-black tabular-nums"
            style={{
              fontSize: g.lastWin > 0 ? '1.5rem' : '0.875rem',
              color: '#FFD700',
              textShadow: g.lastWin > 0 ? '0 0 12px rgba(255,215,0,0.85), 0 1px 3px #000' : 'none',
            }}
          >
            ${g.lastWin.toFixed(2)}
          </p>
          {g.totalWin > 0 && <p className="text-[9px] tracking-widest text-white/60 mt-0.5">TOTAL</p>}
          {g.totalWin > 0 && <p className="text-sm font-bold tabular-nums text-yellow-200">${g.totalWin.toFixed(2)}</p>}
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-widest text-white/60">LINES</p>
          <p className="text-sm font-bold tabular-nums">10</p>
          <p className="text-[9px] tracking-widest text-white/60 mt-0.5">CURRENCY</p>
          <p className="text-sm font-bold">USD</p>
        </div>
      </div>

      {/* Overlays */}
      <ArgoOverlays g={g} showPaytable={showPaytable} setShowPaytable={setShowPaytable} showRules={showRules} setShowRules={setShowRules} />
    </div>
  );
}