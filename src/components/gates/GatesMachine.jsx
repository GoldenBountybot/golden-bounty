import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Plus, Minus, AlignJustify, Info, X } from 'lucide-react';
import GatesSymbol, { SYM_IMG } from './GatesSymbol';
import GatesSpinStrip from './GatesSpinStrip';
import { useGates } from './useGates';
import { BETS, SYMBOLS, MULTIPLIERS } from '@/lib/gatesEngine';

const REELS = 6;
const ROWS = 5;
const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function GatesMachine() {
  const [showInfo, setShowInfo] = useState(false);
  const [showBetMenu, setShowBetMenu] = useState(false);
  const [dropTick, setDropTick] = useState(0);
  const [stoppedReels, setStoppedReels] = useState(() => new Set(Array.from({ length: REELS }, (_, i) => i)));
  const revealTimers = useRef([]);

  const g = useGates();

  // re-trigger the reel-drop animation every time the grid changes
  useEffect(() => { setDropTick((t) => t + 1); }, [g.grid]);

  // reset reels to spinning on spin start; reveal all on spin end
  useEffect(() => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    if (g.spinning) {
      setStoppedReels(new Set());
    } else {
      setStoppedReels(new Set(Array.from({ length: REELS }, (_, i) => i)));
    }
  }, [g.spinning]);

  // sequential column reveal (left → right) whenever a tumble grid arrives
  useEffect(() => {
    if (!g.spinning) return;
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setStoppedReels(new Set());
    const gap = g.turbo ? 25 : 50;
    for (let c = 0; c < REELS; c++) {
      revealTimers.current.push(setTimeout(() => {
        setStoppedReels((prev) => new Set([...prev, c]));
      }, c * gap));
    }
    return () => { revealTimers.current.forEach(clearTimeout); };
  }, [dropTick, g.turbo]);

  useEffect(() => () => { revealTimers.current.forEach(clearTimeout); }, []);

  const {
    grid, balance, bet, spinning, lastWin, message, winPositions, winFlash,
    freeSpins, turbo, autoSpin, spinMult,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin,
  } = g;

  const tumbleWin = spinning ? winFlash : lastWin;
  const showTumbleBar = tumbleWin > 0;

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col overflow-hidden select-none"
      style={{ minHeight: '100dvh', background: 'transparent' }}>

      {showInfo && <GatesInfoPanel onClose={() => setShowInfo(false)} />}

      {/* ── HEADER TITLE BAR ── */}
      <div className="relative flex items-center justify-between px-3 pt-2 pb-1 shrink-0"
        style={{ background: 'linear-gradient(to bottom,rgba(50,10,90,0.95),transparent)' }}>
        {/* Gates of Olympus logo text */}
        <div className="flex-1 flex items-center justify-center">
          <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '18px', fontStyle: 'italic',
            background: 'linear-gradient(to bottom,#fff8c0,#f5c042 40%,#c87018)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.06em',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.9))' }}>
            GATES <span style={{ fontSize: '13px', verticalAlign: 'middle' }}>of</span> OLYMPUS
          </span>
        </div>
      </div>

      {/* ── TUMBLE WIN BAR — sits between title and board ── */}
      <div className="shrink-0 mx-3 mb-1 rounded-[6px] overflow-hidden" style={{ minHeight: 32 }}>
        {showTumbleBar ? (
          <div className="flex items-center justify-center gap-2 py-1.5"
            style={{ background: 'linear-gradient(to right,#1a0808,#3a0a0a,#1a0808)', border: '1px solid rgba(180,60,20,0.6)' }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#d08060', fontWeight: 700, letterSpacing: '0.12em' }}>TUMBLE WIN</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: 900, color: '#ffe080', textShadow: '0 0 10px rgba(255,200,80,0.8)' }}>{fmt(tumbleWin)}</span>
            {spinMult > 1 && (
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '13px', color: '#ffd040', fontWeight: 900 }}>× {spinMult}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-1.5"
            style={{ background: 'linear-gradient(to right,#1a0808,#3a0a0a,#1a0808)', border: '1px solid rgba(180,60,20,0.4)' }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#a06040', fontWeight: 700, letterSpacing: '0.1em' }}>
              {freeSpinsActive ? 'FREE SPINS' : 'SYMBOLS PAY ANYWHERE ON THE SCREEN'}
            </span>
          </div>
        )}
      </div>

      {/* ── REEL BOARD ── golden frame with purple interior */}
      <div className="relative shrink-0 mx-2" style={{ flex: '0 0 auto' }}>
        {/* Outer golden border */}
        <div className="relative rounded-[10px]"
          style={{
            border: '3px solid #d4a93a',
            background: 'transparent',
            boxShadow: '0 0 0 1px #7a4a08, 0 0 0 4px #f8d840, 0 0 0 5px #7a4a08, 0 4px 18px rgba(0,0,0,0.7), 0 0 26px rgba(200,136,10,0.28)',
          }}>
          {/* Inner reel area */}
          <div className="relative rounded-[6px] overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, rgba(18,7,46,0.82), rgba(40,16,82,0.82))', minHeight: 0 }}>

            {/* 6×5 grid — Big Brown style: per-reel scroll strip, sequential stop + drop */}
            <div className="flex gap-[2px] p-[3px]" style={{ height: 'clamp(210px, 33vh, 290px)' }}>
              {grid.map((reel, c) => {
                const stopped = stoppedReels.has(c);
                return (
                  <div key={c} className="relative flex-1 flex flex-col gap-[3px] min-w-0">
                    {reel.map((sym, r) => {
                      const key = `${c}-${r}-${dropTick}`;
                      const winKey = `${c}-${r}`;
                      const isWin = winPositions.has(winKey);
                      return (
                        <div key={key} className="relative rounded-[5px] flex-1 min-h-0"
                          style={{ opacity: stopped ? 1 : 0,
                            border: isWin ? '2px solid rgba(255,150,30,0.95)' : 'none',
                            boxShadow: isWin
                              ? '0 0 0 1px rgba(255,120,0,0.9), 0 0 12px rgba(255,110,0,0.95), 0 0 24px rgba(255,160,30,0.7)'
                              : 'none',
                            animation: isWin ? 'gatesWinGlow 0.7s ease-in-out infinite' : 'none',
                            transition: 'box-shadow 0.15s' }}>
                          {stopped ? (
                            <div className="relative w-full h-full"
                              style={{ animation: `gatesDrop ${g.turbo ? 0.18 : 0.26}s ease-out both` }}>
                              <GatesSymbol sym={sym} highlight={isWin} />
                            </div>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      );
                    })}
                    {!stopped && <GatesSpinStrip turbo={g.turbo} />}
                  </div>
                );
              })}
            </div>

            {/* Win flash overlay on board */}
            {lastWin > 0 && !spinning && (
              <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                <div className="px-5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,200,60,0.5)' }}>
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 900, color: '#ffe060', textShadow: '0 0 10px rgba(255,200,0,0.8)' }}>
                    WIN {fmt(lastWin)}
                  </span>
                </div>
              </div>
            )}

            {/* Free spin start overlay */}
            {showFreeSpinStart && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center"
                style={{ background: 'rgba(20,5,40,0.9)' }}>
                <button onClick={cancelFreeSpinStart} className="absolute top-2 right-2"><X className="w-5 h-5 text-amber-200/70" /></button>
                <div className="text-5xl mb-2">⚡</div>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '22px', color: '#ffe080', textShadow: '0 0 20px rgba(255,200,80,1)' }}>FREE SPINS!</div>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', color: '#ffcc60', marginTop: '4px' }}>{awardedFreeSpins} Games Awarded</div>
                <button onClick={startFreeSpins}
                  className="mt-4 px-8 py-2 rounded-full font-black active:scale-95 transition-transform"
                  style={{ fontFamily: 'Georgia,serif', color: '#2a1a06', background: 'linear-gradient(to bottom,#f8d840,#c8880a)', border: '2px solid #ffe880', fontSize: '15px', boxShadow: '0 0 20px rgba(255,200,80,0.6)' }}>
                  START
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── WIN AMOUNT BELOW BOARD ── */}
      <div className="shrink-0 text-center py-1">
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
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '13px', color: '#c0a060', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {message}
          </div>
        )}
      </div>

      {/* ── BOTTOM PANEL — Olympus temple scene ── */}
      <div className="relative shrink-0 flex-1 flex flex-col justify-between px-3 pb-2"
        style={{ background: 'transparent', minHeight: 180 }}>

        {/* Top row: free spins badge + spin area + multiplier badge */}
        <div className="relative z-10 flex items-start justify-between pt-2 gap-2">

          {/* Free Spins Left badge */}
          <div className="flex flex-col items-center rounded-[8px] px-3 py-1.5 shrink-0"
            style={{ background: 'linear-gradient(135deg,#4a3000,#8a6010,#4a3000)', border: '2px solid #c8980a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)', minWidth: 72 }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#c8a040', letterSpacing: '0.08em' }}>FREE SPINS</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#c8a040', letterSpacing: '0.08em' }}>LEFT</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: 900, color: '#ffe060', lineHeight: 1.1,
              textShadow: '0 0 10px rgba(255,200,0,0.7)' }}>{freeSpins}</span>
          </div>

          {/* Center — spin button area */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {/* Main spin button */}
            <button onClick={spin} disabled={spinning}
              className="rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60"
              style={{ width: 68, height: 68, background: spinning
                ? 'radial-gradient(circle,#555,#333)'
                : 'radial-gradient(circle at 35% 30%,#ffffff,#d8dce0 55%,#a0a8b0 100%)',
                border: '3px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.25)' }}>
              <RotateCcw className={`w-7 h-7 text-slate-700 ${spinning ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            </button>
            {/* Plus bet button */}
            <button onClick={() => { const i = BETS.findIndex(b => Math.abs(bet-b)<0.001); setBet(BETS[Math.min(i+1, BETS.length-1)]); }} disabled={spinning}
              className="rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
              style={{ width: 32, height: 32, background: 'rgba(200,200,200,0.2)', border: '1.5px solid rgba(255,255,255,0.5)' }}>
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Total multiplier badge — golden wings */}
          <div className="flex flex-col items-center shrink-0" style={{ minWidth: 72 }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#f8d840', letterSpacing: '0.06em', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>TOTAL</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', fontWeight: 700, color: '#f8d840', letterSpacing: '0.06em', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>MULTIPLIER</span>
            <div className="relative flex items-center justify-center mt-0.5"
              style={{ width: 68, height: 52 }}>
              {/* Wings */}
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                <path d="M44,30 C30,12 5,10 1,26 C12,22 28,26 40,32 Z" fill="#d4b010" opacity="0.9"/>
                <path d="M44,30 C30,22 8,22 2,36 C14,30 30,32 42,36 Z" fill="#f8e040" opacity="0.6"/>
                <path d="M56,30 C70,12 95,10 99,26 C88,22 72,26 60,32 Z" fill="#d4b010" opacity="0.9"/>
                <path d="M56,30 C70,22 92,22 98,36 C86,30 70,32 58,36 Z" fill="#f8e040" opacity="0.6"/>
              </svg>
              <div className="relative z-10 rounded-full flex items-center justify-center"
                style={{ width: 46, height: 46,
                  background: freeSpinsActive
                    ? 'radial-gradient(circle at 35% 30%,#c0b8f8,#7060e0 50%,#2818a8)'
                    : 'radial-gradient(circle at 35% 30%,#f8e878,#d8a020 50%,#785010)',
                  border: '2.5px solid #f8e060',
                  boxShadow: '0 0 12px rgba(200,160,0,0.8), inset 0 0 10px rgba(255,255,200,0.3)' }}>
                <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '14px',
                  color: freeSpinsActive ? '#e0d8ff' : '#3a2408',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)', lineHeight: 1 }}>
                  {spinMult > 0 ? `${spinMult}x` : freeSpinsActive ? '1x' : '1x'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls bar */}
        <div className="relative z-10 flex items-center justify-between pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
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

          <button onClick={() => { const i = BETS.findIndex(b => Math.abs(bet-b)<0.001); setBet(BETS[Math.max(i-1, 0)]); }}
            disabled={spinning}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <Minus className="w-4 h-4 text-white/80" />
          </button>

          <button onClick={() => setShowBetMenu(s => !s)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <AlignJustify className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Credit / Bet footer */}
        <div className="relative z-10 flex items-center justify-between pt-1">
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: 'rgba(0,0,50,0.75)', fontWeight: 700 }}>
            CREDIT <span style={{ color: '#c87010' }}>{fmt(balance)}</span>
          </span>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: 'rgba(0,0,50,0.75)', fontWeight: 700 }}>
            BET <span style={{ color: '#c87010' }}>{fmt(bet)}</span>
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
    </div>
  );
}

function GatesInfoPanel({ onClose }) {
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
            {pays.map((p, i) => <div key={i} style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#ffe060', fontWeight: 900 }}>×{p}</div>)}
          </div>
        ))}
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#c0a870', marginTop: 10 }}>
          <img src={SYM_IMG.scatter} alt="scatter" style={{ height: 16, width: 'auto', verticalAlign: 'middle' }} /> 4+ Scatters → 15 Free Spins<br/>
          <img src={SYM_IMG.mult} alt="mult" style={{ height: 16, width: 'auto', verticalAlign: 'middle' }} /> Multipliers: ×{MULTIPLIERS[0].v} – ×{MULTIPLIERS[MULTIPLIERS.length-1].v}
        </div>
      </div>
    </div>
  );
}