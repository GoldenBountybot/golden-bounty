import React, { useState, useMemo } from 'react';
import { Zap, Menu, Plus, Minus, RotateCw, DollarSign, Play, History } from 'lucide-react';
import { useArgonauts } from './useArgonauts';
import { REELS, ROWS, FREE_SPINS_AWARD, SYMBOLS } from './argonautsEngine';
import { MIN_BET, MAX_BET } from '@/lib/betStepper';
import PlayerHistoryButton from '@/components/PlayerHistoryButton';

// Bet menu ($ button): whole-dollar tiers from $1 to $500.
const ARGO_BET_MENU = [1, 2, 5, 10, 20, 50, 100, 200, 500];

// Plus icon doubles the bet (0.10 → 0.20 → 0.40 → …), capped at $500.
const argoIncBet = (v) => {
  const n = Number(v) || MIN_BET;
  if (n < MIN_BET) return MIN_BET;
  return Math.min(MAX_BET, Math.round(n * 2 * 100) / 100);
};
// Minus icon halves the bet (reverse of the doubling scale), floored at $0.10.
const argoDecBet = (v) => {
  const n = Number(v) || MIN_BET;
  if (n <= MIN_BET) return MIN_BET;
  return Math.max(MIN_BET, Math.round(n / 2 * 100) / 100);
};
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import GameHeader from '@/components/GameHeader';
import ArgoSymbolTile from './ArgoSymbolTile';
import WinLineOverlay from './WinLineOverlay';
import ArgoOverlays from './ArgoOverlays';
import FreeGamesBanner from './FreeGamesBanner';
import { playSpinSound } from './argoSounds';

const BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png';
// Palace-with-golden-coins backdrop, fades in during the coin free-spin round.
const COIN_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2a63f4def_generated_image.png';

// Spinning reel strip — tall vertical column of random symbols scrolling
// seamlessly (Big Brown style). 4 blocks, last = first for a seamless loop.
const SPIN_IDS = Object.keys(SYMBOLS);

const ArgoSpinStrip = React.memo(function ArgoSpinStrip({ reelIndex, turbo, slowMo }) {
  const strip = React.useMemo(() => {
    const block = () => Array.from({ length: ROWS }, () => SPIN_IDS[Math.floor(Math.random() * SPIN_IDS.length)]);
    const b = block();
    return [...b, ...block(), ...block(), ...b];
  }, [reelIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none">
      <div
        className="flex flex-col gap-1 w-full"
        style={{ animation: `reelFall ${slowMo ? 1.5 : turbo ? 0.4 : 0.6}s linear infinite`, willChange: 'transform' }}
      >
        {strip.map((s, i) => (
          <div key={i} className="rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
            <img
              src={SYMBOLS[s].image}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ opacity: 0.82 }}
            />
          </div>
        ))}
      </div>
      {/* Single dark tint overlay — replaces per-image blur (80 blurred images
          was the #1 lag source during spin). */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(7,13,30,0.25)' }} />
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
  const [showBetMenu, setShowBetMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [spinPulse, setSpinPulse] = useState(false);

  const spinDisabled = g.spinning || g.freeSpinsActive || g.bonusActive || g.riskMode || g.coinMode;

  // Coin free-spin display grid: identical to the main board (regular symbols
  // on every cell), so the coin round looks like the base game. Stuck coins
  // are overlaid on top of their cells and never spin.
  const coinDisplayGrid = useMemo(() => {
    if (!g.coinMode) return g.grid;
    const ids = Object.keys(SYMBOLS);
    const rnd = () => ids[Math.floor(Math.random() * ids.length)];
    return g.grid.map((reel) =>
      reel.map((sym) => (!sym || String(sym).startsWith('vc')) ? rnd() : sym)
    );
  }, [g.grid, g.coinMode]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col text-white overflow-hidden"
      style={{ fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* SVG filter — keys out the black background of the SPIN button image */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="argoSpinDropBlack" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 1 0 0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="2.2" intercept="-0.08" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Coastal background */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* Coin free-spin palace backdrop — slow crossfade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${COIN_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: g.coinMode ? 1 : 0,
          transition: 'opacity 2.4s ease-in-out',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,13,30,0.25), rgba(7,13,30,0.55))' }} />

      <GameHeader title="ARGONAUTS" balance={balance} />

      {/* Metallic title band */}
      <div className="relative pt-0 pb-0 flex justify-center" style={{ marginTop: '-28px' }}>
        <img
          src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8ed43464_generated_image.png"
          alt="ARGONAUTS"
          draggable={false}
          className="select-none"
          style={{ height: 'auto', width: 'min(56vw, 215px)', mixBlendMode: 'screen', objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
        />
      </div>

      {/* Reel grid */}
      <div className="relative flex-1 flex items-start justify-center px-3 py-0" style={{ marginTop: '-48px' }}>
        <div className="w-full max-w-none lg:max-w-[620px] xl:max-w-[700px]">
          {g.freeSpins > 0 && (
            <div className="flex justify-center mb-2" style={{ transform: 'translateY(-4px)' }}>
              <span
                className="px-4 py-1.5 rounded-full font-black tracking-wider animate-pulse inline-flex items-center gap-2"
                style={{ fontSize: '0.9rem', fontFamily: 'Rye, Georgia, serif', border: '1.5px solid #FFD700', background: 'rgba(255,215,0,0.2)', color: '#FFD700', boxShadow: '0 0 12px rgba(255,215,0,0.5)' }}
              >
                <img src={SYMBOLS.scatter.image} alt="scatter" draggable={false} className="w-6 h-6 object-contain" />
                {g.freeSpins} FREE SPINS
              </span>
            </div>
          )}
          {g.coinMode && (
            <div className="flex justify-center mb-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-black tracking-wider animate-pulse"
                style={{ border: '1.5px solid #FFD700', background: 'rgba(255,215,0,0.22)', color: '#FFD700', boxShadow: '0 0 14px rgba(255,215,0,0.6)' }}
              >
                🪙 COIN FEATURE · {g.coinSpins} SPINS
              </span>
            </div>
          )}

          <div
            className="relative grid gap-1 p-1.5 rounded-[12px]"
            style={{
              gridTemplateColumns: `repeat(${REELS}, 1fr)`,
              border: '4px solid transparent',
              borderRadius: '12px',
              boxShadow: '0 0 0 1px rgba(60,35,12,0.9), 0 0 18px rgba(0,0,0,0.6), 0 0 24px rgba(255,215,0,0.4), inset 0 0 0 2px rgba(255,215,0,0.55)',
              background: 'transparent',
            }}
          >
            {!g.coinMode && (
              <div className="absolute inset-0 rounded-[12px] pointer-events-none" style={{
                padding: 4,
                background: 'linear-gradient(135deg, #C9A04A 0%, #FFE9A8 20%, #8a5a10 45%, #C9A04A 70%, #5b3a06 100%)',
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }} />
            )}
            {g.showFreeSpinStart && (
              <FreeGamesBanner count={FREE_SPINS_AWARD} onStart={g.startFreeSpins} />
            )}
            {g.grid.map((reel, ri) => {
              // ---- Coin hold-and-spin round: locked coins + empty ornate
              // placeholders; only new value coins drop, no other symbols. ----
              if (g.coinMode) {
                return (
                  <div key={ri} className="relative flex flex-col gap-1">
                    {coinDisplayGrid[ri].map((sym, row) => {
                      const key = `${ri}-${row}`;
                      const mult = g.coinStuck[key];
                      // Stuck coin — stays put on top of the spinning reel
                      if (mult) {
                        const justDropped = g.coinDropped && g.coinDropped.has(key);
                        return (
                          <div key={key} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', zIndex: 20, background: '#4D0505' }}>
                            <div className="w-full h-full" style={justDropped ? { animation: 'ccReelLand 0.45s ease-out both' } : undefined}>
                              <ArgoSymbolTile sym={`vc${mult}`} bet={g.bet} stuck />
                            </div>
                          </div>
                        );
                      }
                      // Empty cell — renders exactly like the main board
                      return (
                        <div key={key} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', opacity: g.spinning ? 0 : 1 }}>
                          {g.spinning ? (
                            <div key={`spinning-${ri}-${row}`} className="w-full h-full" style={{ background: 'rgba(12,8,30,0.92)' }} />
                          ) : (
                            <div key={`landed-${ri}-${row}`} className="w-full h-full" style={{ animation: 'bbSymbolDrop 0.34s ease-out both' }}>
                              <ArgoSymbolTile sym={sym} bet={g.bet} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {g.spinning && <ArgoSpinStrip reelIndex={ri} turbo={g.turbo} />}
                  </div>
                );
              }
              const stopped = g.spinningReels.has(ri);
              const slowDrop = g.slowMoReels.has(ri);
              return (
                <div key={ri} className="relative flex flex-col gap-1">
                  {reel.map((sym, row) => {
                    const key = `${ri}-${row}`;
                    const isWin = g.winningPositions.has(key);
                    return (
                      <div key={key} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', opacity: stopped ? 1 : 0 }}>
                        {stopped ? (
                          <div key={`landed-${ri}-${row}`} className="w-full h-full" style={{ animation: `bbSymbolDrop ${slowDrop ? '1.2s' : '0.34s'} ${slowDrop ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'ease-out'} both` }}>
                            <ArgoSymbolTile sym={sym} win={isWin} dim={g.winningPositions.size > 0 && !isWin} bet={g.bet} />
                          </div>
                        ) : (
                          <div key={`spinning-${ri}-${row}`} className="w-full h-full" style={{ background: 'rgba(12,8,30,0.92)' }} />
                        )}
                      </div>
                    );
                  })}
                  {!stopped && <ArgoSpinStrip reelIndex={ri} turbo={g.turbo} slowMo={g.anticipateReels.has(ri)} />}
                </div>
              );
            })}
            <WinLineOverlay winningLines={g.winningLines} />
          </div>

          {/* Status strip: free-game labels + message — Rye golden 3D text inside a stylish western wooden frame, transparent center so game backdrop shows through */}
          <div
            className="mt-2 relative rounded-[10px] px-3 py-2"
            style={{
              border: '3px solid transparent',
              borderRadius: '10px',
              boxShadow: '0 0 0 1px rgba(60,35,12,0.9), 0 0 14px rgba(0,0,0,0.55)',
              background: 'transparent',
            }}
          >
            <div className="absolute inset-0 rounded-[10px] pointer-events-none" style={{
              padding: 3,
              background: 'linear-gradient(135deg, #C9A04A 0%, #FFE9A8 20%, #8a5a10 45%, #C9A04A 70%, #5b3a06 100%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />
            {g.freeSpins > 0 && (
              <div className="flex justify-between text-[11px] font-black tracking-wide" style={{ fontFamily: 'Rye, Georgia, serif', color: '#FFD700', textShadow: '0 1px 0 #b8860b, 0 2px 0 #8a5a10, 0 3px 0 #5b3a06, 0 4px 1px rgba(0,0,0,0.7), 0 0 16px rgba(255,235,80,0.95), 0 0 26px rgba(255,200,40,0.7)' }}>
                <span>FREE SPIN PAYS ${g.bet.toFixed(2)}</span>
                <span>FREE GAME {FREE_SPINS_AWARD - g.freeSpins + 1} OF {FREE_SPINS_AWARD}</span>
              </div>
            )}
            {g.coinMode && (
              <div className="flex items-center justify-center gap-2 mb-1">
                {[3, 2, 1].map((n) => {
                  const active = g.coinSpins === n;
                  return (
                    <span
                      key={n}
                      className="flex items-center justify-center rounded-full font-black tabular-nums transition-all"
                      style={{
                        width: active ? 30 : 22,
                        height: active ? 30 : 22,
                        fontSize: active ? '0.95rem' : '0.72rem',
                        fontFamily: 'Rye, Georgia, serif',
                        color: active ? '#2a1a06' : 'rgba(255,235,150,0.7)',
                        border: `1.5px solid ${active ? '#FFD700' : 'rgba(255,215,0,0.45)'}`,
                        background: active
                          ? 'radial-gradient(circle, #FFE9A8, #FFD700 60%, #C59A4D)'
                          : 'transparent',
                        boxShadow: active ? '0 0 16px rgba(255,215,0,0.95)' : 'none',
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {n}
                    </span>
                  );
                })}
                <span className="ml-1 text-[11px] font-black tracking-widest" style={{ fontFamily: 'Rye, Georgia, serif', color: '#FFD700', textShadow: '0 1px 0 #b8860b, 0 2px 0 #8a5a10, 0 3px 0 #5b3a06, 0 4px 1px rgba(0,0,0,0.7), 0 0 16px rgba(255,235,80,0.95), 0 0 26px rgba(255,200,40,0.7)' }}>
                  SPIN{g.coinSpins !== 1 ? 'S' : ''} LEFT
                </span>
              </div>
            )}
            <div className="text-center min-h-[18px]">
              <p className="text-xs font-black tracking-wide" style={{ fontFamily: 'Rye, Georgia, serif', color: '#FFD700', textShadow: '0 1px 0 #b8860b, 0 2px 0 #8a5a10, 0 3px 0 #5b3a06, 0 4px 1px rgba(0,0,0,0.7), 0 0 16px rgba(255,235,80,0.95), 0 0 26px rgba(255,200,40,0.7)' }}>{g.message}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="relative px-3 pb-2" style={{ marginTop: '40px' }}>
        <div className="mx-auto max-w-none lg:max-w-[620px] xl:max-w-[700px] flex flex-col items-center gap-2">
          {/* Spin button — centered on its own row above the rest */}
          <button
            onClick={() => { playSpinSound(); setSpinPulse(true); setTimeout(() => setSpinPulse(false), 220); g.spin(); }}
            disabled={spinDisabled}
            className="relative flex items-center justify-center disabled:opacity-70"
            style={{
              width: 72,
              height: 72,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: spinDisabled ? 'not-allowed' : 'pointer',
              transform: spinPulse ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 180ms ease-out',
            }}
          >
            <img
              src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/71f946c63_file_00000000e5d881fab7f33117c10362eb.png"
              alt="SPIN"
              draggable={false}
              className="block w-full h-full object-contain"
              style={{ filter: 'url(#argoSpinDropBlack)' }}
            />
          </button>

          {/* Bottom row: all other controls */}
          <div className="flex items-center justify-between gap-2 w-full">
            <IconButton onClick={() => g.setBet(argoDecBet(g.bet))} disabled={g.spinning || g.coinMode || g.bet <= MIN_BET} title="Decrease bet"><Minus className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => g.setBet(argoIncBet(g.bet))} disabled={g.spinning || g.coinMode || g.bet >= MAX_BET} title="Increase bet"><Plus className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => g.setTurbo(!g.turbo)} active={g.turbo} disabled={g.spinning} title="Turbo"><Zap className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => g.setAutoSpin(!g.autoSpin)} active={g.autoSpin} disabled={g.spinning} title="Auto spin"><RotateCw className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => setShowBetMenu(s => !s)} active={showBetMenu} disabled={g.spinning} title="Bet menu"><DollarSign className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => setShowPaytable(true)} title="Menu"><Menu className="w-5 h-5" /></IconButton>
            <IconButton onClick={() => setShowHistory(true)} title="Game history"><History className="w-5 h-5" /></IconButton>
          </div>

          {/* Bet menu popover */}
          {showBetMenu && (
            <div className="mt-2 mx-auto max-w-[230px] rounded-[8px] p-1.5 flex flex-wrap gap-1 justify-center" style={{ background: 'rgba(7,13,30,0.96)', border: '1px solid rgba(255,215,0,0.4)', boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
              {ARGO_BET_MENU.map((b) => {
                const active = Math.abs(g.bet - b) < 0.001;
                return (
                  <button
                    key={b}
                    onClick={() => { g.setBet(b); setShowBetMenu(false); }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold tabular-nums ${active ? 'text-yellow-300' : 'text-white/70'}`}
                    style={{ fontFamily: 'Georgia, serif', background: active ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)', border: `1px solid ${active ? 'rgba(255,215,0,0.6)' : 'rgba(255,215,0,0.2)'}` }}
                  >
                    ${b.toFixed(2)}
                  </button>
                );
              })}
            </div>
          )}

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
        className="relative px-4 py-2 mx-auto max-w-none lg:max-w-[620px] xl:max-w-[700px] w-full grid grid-cols-3 gap-2 text-center"
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
      <PlayerHistoryButton gameId="argonauts" renderButton={false} externalOpen={showHistory} onExternalClose={() => setShowHistory(false)} title="Argonauts History" />
    </div>
  );
}