import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Plus, Minus, AlignJustify, Info, X } from 'lucide-react';
import GatesSymbol, { SYM_IMG } from './GatesSymbol';
import GatesSpinStrip from './GatesSpinStrip';
import GatesWinBoard from './GatesWinBoard';
import GatesOrnateFrame from './GatesOrnateFrame';
import GatesFreeSpinBanner from './GatesFreeSpinBanner';
import GatesMultReveal from './GatesMultReveal';
import GatesBolt from './GatesBolt';
import GatesMultBanner from './GatesMultBanner';
import GatesTumbleWinBanner from './GatesTumbleWinBanner';
import { useGates } from './useGates';
import { BETS, SYMBOLS, isMult, multValue, multColor, MIN_BET, MAX_BET, BET_STEP } from '@/lib/gatesEngine';
import { playReelDropSound, playScatterDropSound } from '@/lib/gatesSound';

const REELS = 6;
const ROWS = 5;
const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function GatesMachine() {
  const [showInfo, setShowInfo] = useState(false);
  const [showBetMenu, setShowBetMenu] = useState(false);
  const [dropTick, setDropTick] = useState(0);
  const [shatterTick, setShatterTick] = useState(0);
  const [stoppedReels, setStoppedReels] = useState(() => new Set(Array.from({ length: REELS }, (_, i) => i)));
  const revealTimers = useRef([]);
  const revealedRef = useRef(false);
  const machineRef = useRef(null);
  const cellRefs = useRef({});
  const struckRef = useRef(new Set());
  const [bolts, setBolts] = useState({});

  const g = useGates();

  // re-trigger the reel-drop animation every time the grid changes
  useEffect(() => { setDropTick((t) => t + 1); }, [g.grid]);
  // bump shatter key whenever the shatter set changes so the blast replays
  useEffect(() => { setShatterTick((t) => t + 1); }, [g.shatter]);

  // reset reels to spinning on spin start; reveal all on spin end
  useEffect(() => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    if (g.spinning) {
      revealedRef.current = false;
      setStoppedReels(new Set());
    } else {
      revealedRef.current = false;
      setStoppedReels(new Set(Array.from({ length: REELS }, (_, i) => i)));
    }
  }, [g.spinning]);

  // sequential column reveal (left → right) only for the first spin result;
  // tumbles keep all reels stopped and just refill the shattered cells.
  useEffect(() => {
    if (!g.spinning) return;
    if (revealedRef.current) {
      setStoppedReels(new Set(Array.from({ length: REELS }, (_, i) => i)));
      return;
    }
    revealedRef.current = true;
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setStoppedReels(new Set());
    const gap = g.turbo ? 25 : 50;
    for (let c = 0; c < REELS; c++) {
      revealTimers.current.push(setTimeout(() => {
        setStoppedReels((prev) => new Set([...prev, c]));
        playReelDropSound(c);
        // Play the scatter chime if this reel's final column contains a scatter.
        const reel = g.grid[c];
        if (reel && reel.some((s) => s === 'scatter')) playScatterDropSound();
      }, c * gap));
    }
    return () => { revealTimers.current.forEach(clearTimeout); };
  }, [dropTick, g.turbo]);

  useEffect(() => () => { revealTimers.current.forEach(clearTimeout); }, []);

  const {
    grid, balance, bet, spinning, lastWin, message, winPositions, shatter, dropCells, winFlash,
    freeSpins, turbo, autoSpin, spinMult, winList, winHistory, scatterGlow,
    showFreeSpinStart, freeSpinsActive, startFreeSpins,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, buyFreeSpins,
  } = g;

  const allReelsStopped = stoppedReels.size >= REELS;
  const reelsSpinning = spinning && !allReelsStopped;

  // Reset the "already struck" set whenever a new tumble's fresh cells arrive.
  useEffect(() => { struckRef.current = new Set(); }, [dropCells]);

  // Lightning: when a fresh multiplier symbol lands on a stopped reel, strike
  // a bolt from the top of the machine (the banner / sky) down onto its cell.
  // Rendered at the machine root so the reel area's overflow-hidden can't clip it.
  useEffect(() => {
    const root = machineRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const fire = [];
    for (let c = 0; c < REELS; c++) {
      if (!stoppedReels.has(c)) continue;
      for (let r = 0; r < ROWS; r++) {
        const key = `${c}-${r}`;
        if (struckRef.current.has(key)) continue;
        if (!isMult(grid[c][r])) continue;
        if (!dropCells.has(key)) continue;
        const el = cellRefs.current[key];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        fire.push({
          key,
          x: rect.left + rect.width / 2 - rootRect.left,
          y: rect.top + rect.height / 2 - rootRect.top,
        });
      }
    }
    if (!fire.length) return;
    fire.forEach((b) => struckRef.current.add(b.key));
    setBolts((prev) => ({ ...prev, ...Object.fromEntries(fire.map((b) => [b.key, b])) }));
    const dur = (turbo ? 420 : 700) + 120;
    const t = setTimeout(() => {
      setBolts((prev) => {
        const copy = { ...prev };
        fire.forEach((b) => delete copy[b.key]);
        return copy;
      });
    }, dur);
    return () => clearTimeout(t);
  }, [stoppedReels, grid, dropCells, dropTick, turbo]);

  return (
    <div ref={machineRef} className="relative w-full max-w-md mx-auto flex flex-col overflow-hidden select-none"
      style={{ minHeight: '100dvh', background: 'transparent' }}>

      {showInfo && <GatesInfoPanel bet={bet} onClose={() => setShowInfo(false)} />}

      {/* ── GATES OF OLYMPUS TITLE BANNER ── sits just above the board border */}
      <div className="relative flex items-center justify-start shrink-0 pt-10 pb-0 pl-1"
        style={{ background: 'linear-gradient(to bottom,rgba(50,10,90,0.95),transparent)', marginBottom: 10, marginLeft: -6, zIndex: 20 }}>
        <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5a4c02bcc_file_000000003af0820bb4a62aa92952a91e.png"
          alt="Gates of Olympus"
          style={{ width: '60%', maxWidth: 240, height: 'auto', objectFit: 'contain',
            marginTop: -58,
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))' }} />
        {/* Zeus figure on the right side of the banner */}
        <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/84fd16eb6_file_00000000e474820ba9fd196f5f5c9f06.png"
          alt="Zeus"
          className="pointer-events-none select-none"
          style={{ position: 'absolute', right: '-10%', bottom: -12, width: '58%', maxWidth: 220,
            height: 'auto', objectFit: 'contain',
            clipPath: 'inset(0 0 6px 0)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))' }} />
      </div>

      {/* ── REEL BOARD ── golden frame with purple interior */}
      <div className="relative shrink-0 mx-2" style={{ flex: '0 0 auto', marginTop: 0 }}>
        <GatesTumbleWinBanner winHistory={winHistory} balance={balance} winFlash={winFlash} />
        {/* Outer golden border */}
        <div className="relative rounded-[10px]"
          style={{
            border: '3px solid #d4a93a',
            background: 'transparent',
            boxShadow: '0 0 0 1px #7a4a08, 0 0 0 4px #f8d840, 0 0 0 5px #7a4a08, 0 4px 18px rgba(0,0,0,0.7), 0 0 26px rgba(200,136,10,0.28)',
          }}>
          <GatesOrnateFrame />
          {/* Inner reel area */}
          <div className="relative rounded-[6px] overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, rgba(52,26,96,0.42), rgba(74,38,132,0.42))', minHeight: 0 }}>

            {/* 6×5 grid — Big Brown style: per-reel scroll strip, sequential stop + drop */}
            <div className="flex gap-[4px] p-[5px]" style={{ height: 'clamp(240px, 42vh, 340px)' }}>
              {grid.map((reel, c) => {
                const stopped = stoppedReels.has(c);
                return (
                  <React.Fragment key={c}>
                  <div className="relative flex-1 flex flex-col gap-[6px] min-w-0">
                    {reel.map((sym, r) => {
                      const winKey = `${c}-${r}`;
                      const isShatter = shatter.has(winKey);
                      const isFresh = dropCells.has(winKey);
                      const isWin = !isShatter && winPositions.has(winKey);
                      const isScatterGlow = scatterGlow.has(winKey);
                      const symIsMult = isMult(sym);
                      // value (multiplier) symbols drop normally like any
                      // other fresh symbol; the lightning reveal is handled by
                      // the GatesMultReveal overlay.
                      const dropAnim = isFresh;
                      const animKey = isShatter ? `sh${shatterTick}` : dropAnim ? `dr${dropTick}` : 'st';
                      return (
                        <div key={winKey} ref={(el) => { cellRefs.current[winKey] = el; }} className="relative rounded-[5px] flex-1 min-h-0"
                          style={{ opacity: stopped ? 1 : 0,
                            boxSizing: 'border-box',
                            border: '1.5px solid transparent',
                            boxShadow: 'none',
                            animation: isWin ? 'gatesWinGlow 0.55s linear infinite' : 'none',
                            transition: 'box-shadow 0.15s' }}>
                          {stopped ? (
                            <div key={animKey} className="relative w-full h-full"
                              style={{ animation: isScatterGlow ? 'gatesScatterGlow 0.9s ease-in-out infinite'
                                : isShatter
                                ? `shatterWin ${g.turbo ? 0.24 : 0.4}s ease-out forwards`
                                : dropAnim ? `gatesDrop ${g.turbo ? 0.18 : 0.26}s cubic-bezier(0.22,0.7,0.32,1) both` : 'none' }}>
                              <GatesSymbol sym={sym} highlight={isWin || isScatterGlow} />
                              {symIsMult && (
                                <GatesMultReveal
                                  value={multValue(sym)}
                                  color={multColor(multValue(sym))}
                                  fresh={isFresh}
                                  turbo={g.turbo} />
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      );
                    })}
                    {!stopped && <GatesSpinStrip turbo={g.turbo} />}
                  </div>
                  {c < REELS - 1 && (
                    <div className="self-stretch" style={{ width: 1, background: 'linear-gradient(to bottom, rgba(212,169,58,0.1), rgba(212,169,58,0.55), rgba(212,169,58,0.1))', boxShadow: '0 0 4px rgba(212,169,58,0.4)' }} />
                  )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Free spin start banner */}
            {showFreeSpinStart && (
              <GatesFreeSpinBanner onStart={startFreeSpins} />
            )}
          </div>
        </div>
      </div>

      {/* ── WIN AMOUNT BELOW BOARD ── */}
      <div className="shrink-0 text-center py-0" style={{ marginTop: 10 }}>
        {lastWin > 0 && !spinning ? (
          <>
            <div style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '20px', color: '#ffe060', textShadow: '0 0 14px rgba(255,200,0,0.9)', letterSpacing: '0.04em' }}>
              WIN {fmt(lastWin)}
            </div>
            {g.winFlash > 0 && (
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#c0a060', marginTop: '1px' }}>WINNER</div>
            )}
          </>
        ) : (
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 900, color: '#ffd650', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 0 10px rgba(255,200,0,0.85), 0 1px 2px rgba(0,0,0,0.8)' }}>
            {message}
          </div>
        )}
      </div>

      {/* ── BOTTOM PANEL — Olympus temple scene ── */}
      <div className="relative shrink-0 flex flex-col px-3 pb-2"
        style={{ background: 'transparent' }}>

        {/* Top row: free spins badge + spin area + multiplier badge */}
        <div className="relative z-10 flex items-center justify-between gap-2" style={{ marginTop: 60 }}>

          {/* Win board — pinned to the LEFT edge */}
          <GatesWinBoard history={winHistory} amount={spinning ? winFlash : lastWin} />

          {/* Center — spin button (base game) OR total multiplier banner (free spins) */}
          {freeSpinsActive ? (
            <GatesMultBanner value={spinMult} />
          ) : (
            <div className="flex flex-col items-center gap-1.5" style={{ transform: 'translateX(-10px)' }}>
              {/* Main spin button */}
              <button onClick={spin} disabled={spinning}
                className="rounded-[22px] flex items-center justify-center active:scale-95 transition-transform"
                style={{ width: 68, height: 68,
                  background: 'transparent',
                  border: '3px solid rgba(255,255,255,0.95)',
                  borderRadius: 22,
                  boxShadow: spinning ? undefined : '0 2px 10px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.2)',
                  animation: spinning ? 'gatesSpinGlow 1s ease-in-out infinite' : 'none' }}>
                <span style={{ width: 26, height: 26, borderRadius: 9,
                  border: '2px solid rgba(255,255,255,0.9)',
                  background: 'rgba(255,255,255,0.12)',
                  boxShadow: '0 0 8px rgba(255,255,255,0.35), inset 0 0 6px rgba(255,255,255,0.25)' }} />
              </button>
              {/* Bet amount — shown directly under the spin button */}
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 900, color: '#000000',
                textShadow: '0 1px 2px rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
                <span style={{ fontSize: '13px', letterSpacing: '0.08em', WebkitTextStroke: '1px #000' }}>BET </span>{fmt(bet)}
              </span>
            </div>
          )}

          {/* Buy Free Spins / Free Spins Left — on the RIGHT of the spin button */}
          {freeSpinsActive ? (
            <div className="flex flex-col items-center rounded-[8px] px-3 py-1.5 shrink-0"
              style={{ background: 'linear-gradient(135deg,#4a3000,#8a6010,#4a3000)', border: '2px solid #c8980a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)', minWidth: 72 }}>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#c8a040', letterSpacing: '0.08em' }}>FREE SPINS</span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#c8a040', letterSpacing: '0.08em' }}>LEFT</span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: 900, color: '#ffe060', lineHeight: 1.1,
                textShadow: '0 0 10px rgba(255,200,0,0.7)' }}>{freeSpins}</span>
            </div>
          ) : (
            <button onClick={buyFreeSpins} disabled={spinning}
              className="flex flex-col items-center rounded-[8px] px-2 py-1.5 shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#3a1052,#7a30a0,#3a1052)', border: '2px solid #b070e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)', minWidth: 72 }}>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 900, color: '#e0c0ff', letterSpacing: '0.06em' }}>BUY FREE</span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 900, color: '#e0c0ff', letterSpacing: '0.06em' }}>SPINS</span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '13px', fontWeight: 900, color: '#ffe080', lineHeight: 1.1,
                textShadow: '0 0 8px rgba(255,200,0,0.7)' }}>{fmt(bet * 100)}</span>
            </button>
          )}
        </div>

        {/* Bottom controls bar — moved up to sit closer to the spin button */}
        <div className="relative z-20 flex items-center justify-between pt-2"
          style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button onClick={() => setShowInfo(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <Info className="w-4 h-4 text-white/80" />
          </button>

          <button onClick={() => setAutoSpin(a => !a)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: autoSpin ? 'rgba(80,200,120,0.3)' : 'rgba(0,0,0,0.35)', border: `1.5px solid ${autoSpin ? 'rgba(80,220,120,0.8)' : 'rgba(255,255,255,0.4)'}` }}>
            <RotateCcw className={`w-4 h-4 ${autoSpin ? 'text-emerald-300' : 'text-white/80'}`} />
          </button>

          <button onClick={() => setBet(Math.max(MIN_BET, Math.round((bet - BET_STEP) * 100) / 100))}
            disabled={spinning}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <Minus className="w-4 h-4 text-white/80" />
          </button>

          <button onClick={() => setBet(Math.min(MAX_BET, Math.round((bet + BET_STEP) * 100) / 100))} disabled={spinning}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <Plus className="w-4 h-4 text-white/80" />
          </button>

          <button onClick={() => setShowBetMenu(s => !s)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <AlignJustify className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Credit footer */}
        <div className="relative z-10 flex items-center justify-center pt-1">
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '18px', color: '#000000', fontWeight: 900, letterSpacing: '0.04em', textShadow: '0 1px 2px rgba(255,255,255,0.6)', WebkitTextStroke: '1px #000' }}>
            CREDIT <span>{fmt(balance)}</span>
          </span>
        </div>
      </div>

      {/* Bet menu popup */}
      {showBetMenu && (
        <div className="absolute bottom-20 right-3 z-50 rounded-[8px] p-2 flex flex-col gap-1"
          style={{ background: 'rgba(10,5,25,0.97)', border: '1.5px solid rgba(200,140,10,0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.7)', minWidth: 100 }}>
          <div className="text-[9px] text-amber-300/60 font-bold tracking-widest px-1 mb-1" style={{ fontFamily: 'Georgia,serif' }}>SELECT BET</div>
          {BETS.map((b) => {
            const active = Math.abs(bet - b) < 0.001;
            return (
              <button key={b} onClick={() => { setBet(b); setShowBetMenu(false); }}
                className="px-3 py-1 rounded text-[12px] italic font-bold text-left transition-colors"
                style={{ fontFamily: 'Georgia,serif', color: active ? '#ffe060' : '#c0a870', background: active ? 'rgba(200,140,10,0.2)' : 'transparent' }}>
                {fmt(b)}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightning bolts — strike down from the banner (sky) onto fresh
          multiplier symbols. Rendered at the machine root so they are not
          clipped by the reel area's overflow-hidden. */}
      {Object.values(bolts).map((b) => (
        <GatesBolt key={b.key} x={b.x} y={b.y} turbo={turbo} />
      ))}
    </div>
  );
}

function GatesInfoPanel({ bet, onClose }) {
  const rows = [
    ['zeus', '⚡', 2, 5, 10, 20],
    ['crown', '👑', 1.5, 3, 6, 12],
    ['hourglass', '⏳', 1, 2, 4, 8],
    ['ring', '💍', 0.8, 1.5, 3, 6],
    ['goblet', '🏆', 0.5, 1, 2, 4],
    ['red', '🔴', 0.25, 0.5, 1, 2],
    ['blue', '🔵', 0.25, 0.5, 1, 2],
    ['green', '🟢', 0.25, 0.5, 1, 2],
    ['yellow', '🟡', 0.25, 0.5, 1, 2],
  ];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-[10px] p-4 max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(to bottom,#1a0a38,#0a0518)', border: '2px solid rgba(200,140,10,0.6)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '16px', color: '#ffe080' }}>PAYTABLE</h3>
          <X className="w-5 h-5 text-amber-300/70 cursor-pointer" onClick={onClose} />
        </div>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#c0a870', lineHeight: 1.5, marginBottom: 12 }}>
          8+ matching symbols anywhere pay. Winning symbols tumble; new ones drop. ×2–×500 multiplier symbols stick and sum during free spins. 4+ scatters → 15 Free Spins.
        </p>
        <div className="grid grid-cols-6 text-center mb-1" style={{ fontFamily: 'Georgia,serif', fontSize: '9px', color: '#c0a050', fontWeight: 700 }}>
          <div></div><div></div><div>8+</div><div>12+</div><div>15+</div><div>20+</div>
        </div>
        {rows.map(([sym, , ...pays]) => (
          <div key={sym} className="grid grid-cols-6 items-center py-1 text-center" style={{ borderBottom: '1px solid rgba(200,140,10,0.15)' }}>
            <div className="flex items-center justify-center" style={{ height: 28 }}>
              <img src={SYM_IMG[sym]} alt={sym} style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '9px', color: '#a08050', fontWeight: 700 }}>{sym.toUpperCase()}</div>
            {pays.map((p, i) => <div key={i} style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#ffe060', fontWeight: 900 }}>{fmt(p * bet)}</div>)}
          </div>
        ))}
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#c0a870', marginTop: 10 }}>
          <img src={SYM_IMG.scatter} alt="scatter" style={{ height: 16, width: 'auto', verticalAlign: 'middle' }} /> 4+ Scatters → 15 Free Spins
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><img src={SYM_IMG.mult} alt="green" style={{ height: 15, width: 'auto', verticalAlign: 'middle', mixBlendMode: 'screen' }} /> Green: ×1 – ×9</div>
            <div><img src={SYM_IMG.mult_blue} alt="blue" style={{ height: 15, width: 'auto', verticalAlign: 'middle', mixBlendMode: 'screen' }} /> Blue: ×10 – ×50</div>
            <div><img src={SYM_IMG.mult_pink} alt="pink" style={{ height: 15, width: 'auto', verticalAlign: 'middle', mixBlendMode: 'screen' }} /> Pink: ×51 – ×100</div>
            <div><img src={SYM_IMG.mult_red} alt="red" style={{ height: 15, width: 'auto', verticalAlign: 'middle', mixBlendMode: 'screen' }} /> Red: ×101 – ×500</div>
          </div>
        </div>
      </div>
    </div>
  );
}