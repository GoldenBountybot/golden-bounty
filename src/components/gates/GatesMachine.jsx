import React, { useState } from 'react';
import { Zap, Plus, Repeat, DollarSign, Menu, Play, Info, X } from 'lucide-react';
import GatesSymbol from './GatesSymbol';
import { useGates } from './useGates';
import { BETS, SYMBOLS, PAY, MULTIPLIERS } from '@/lib/gatesEngine';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

const OLYMPUS_BG =
  "radial-gradient(ellipse at 50% 0%, #3a5a8f 0%, #1a2a55 35%, #0a1330 70%, #050a1c 100%)";

export default function GatesMachine() {
  const [showInfo, setShowInfo] = useState(false);
  const [showBetMenu, setShowBetMenu] = useState(false);
  const g = useGates();
  const {
    grid, balance, bet, spinning, lastWin, message, winPositions,
    freeSpins, turbo, autoSpin, spinMult, winFlash,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin,
  } = g;

  return (
    <div
      className="relative w-full max-w-md mx-auto min-h-screen flex flex-col overflow-hidden"
      style={{ background: OLYMPUS_BG, isolation: 'isolate' }}
    >
      {showInfo && <GatesInfo bet={bet} onClose={() => setShowInfo(false)} />}

      <button
        onClick={() => setShowInfo(true)}
        className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{ border: '1.5px solid rgba(214,178,98,0.7)', background: 'radial-gradient(circle, rgba(20,30,55,0.9), rgba(5,12,28,0.95))', boxShadow: '0 0 8px rgba(214,178,98,0.25)' }}
      >
        <Info className="w-4 h-4 text-amber-300" />
      </button>

      <div className="flex items-center justify-center pt-2 pb-1">
        <h2 className="text-xl font-black italic tracking-[0.12em]" style={{ fontFamily: 'Rye, Georgia, serif', background: 'linear-gradient(to bottom,#fff7d6,#f5c542 45%,#c8881e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}>
          GATES OF OLYMPUS
        </h2>
      </div>

      {/* Reel area — board spans ~55% of the viewport height, tight square cells */}
      <div className="relative px-3 z-10 flex justify-center" style={{ height: '55vh', minHeight: 300 }}>
        <div
          className="relative rounded-[12px] overflow-hidden h-full w-full"
          style={{ padding: 7, background: 'linear-gradient(145deg,#2a3a6a,#0a1530)', boxShadow: 'inset 0 0 0 2px rgba(255,140,0,0.65), inset 0 0 0 4px rgba(10,15,30,0.85), 0 4px 22px rgba(0,0,0,0.7), 0 0 18px rgba(255,140,0,0.25)' }}
        >
          <div className="relative rounded-[8px] overflow-hidden h-full w-full p-1.5" style={{ background: 'linear-gradient(to bottom,#1a0f2e,#0a0518)', boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85)' }}>
            <div className="grid gap-1 h-full" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
              {grid.map((reel, c) => (
                <div key={c} className="relative flex flex-col gap-1.5">
                  {reel.map((sym, r) => {
                    const key = `${c}-${r}`;
                    const isWin = winPositions.has(key);
                    return (
                      <div key={key} className="relative rounded-[6px]" style={{ aspectRatio: '1 / 1', height: '100%' }}>
                        <GatesSymbol sym={sym} highlight={isWin} dropping={!spinning} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Free spin start overlay */}
            {showFreeSpinStart && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: 'rgba(5,10,25,0.88)' }}>
                <X className="absolute top-2 right-2 w-5 h-5 text-amber-200/70" onClick={cancelFreeSpinStart} />
                <span className="text-3xl mb-1">⚡</span>
                <h3 className="text-lg font-black italic mb-1" style={{ fontFamily: 'Rye, Georgia, serif', color: '#ffe9a8' }}>FREE SPINS</h3>
                <p className="text-sm text-amber-200/80 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{awardedFreeSpins} Free Games Awarded</p>
                <button
                  onClick={startFreeSpins}
                  className="px-6 py-2 rounded-full font-black italic tracking-wide active:scale-95 transition-transform"
                  style={{ fontFamily: 'Georgia, serif', color: '#2a1a06', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', border: '1.5px solid rgba(255,234,160,0.8)', boxShadow: '0 0 16px rgba(255,200,80,0.5)' }}
                >
                  START
                </button>
              </div>
            )}

            {/* Multiplier badge */}
            {spinMult > 0 && (
              <div className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'radial-gradient(circle,#fff7d6,#f5c542 60%,#8b5a2b)', border: '1.5px solid #fff0c0', boxShadow: '0 0 14px rgba(255,200,80,0.9)' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: '#3a2408' }} />
                <span className="text-sm font-black italic" style={{ fontFamily: 'Georgia, serif', color: '#3a2408' }}>×{spinMult}</span>
              </div>
            )}

            {/* Win display */}
            {lastWin > 0 && !spinning && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,210,80,0.6)' }}>
                <span className="text-sm italic font-black text-yellow-300 animate-pulse" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 8px rgba(255,234,0,0.7)' }}>
                  WIN {fmt(lastWin)}
                </span>
              </div>
            )}
            {spinning && winFlash > 0 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,210,80,0.5)' }}>
                <span className="text-sm italic font-black text-yellow-200" style={{ fontFamily: 'Georgia, serif' }}>{fmt(winFlash)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet menu */}
      {showBetMenu && (
        <div className="absolute bottom-24 left-3 z-40 rounded-[8px] p-1.5 flex flex-col gap-1" style={{ background: 'rgba(8,15,35,0.97)', border: '1px solid rgba(214,178,98,0.5)', boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
          {BETS.map((b) => {
            const active = Math.abs(bet - b) < 0.001;
            return (
              <button key={b} onClick={() => { setBet(b); setShowBetMenu(false); }}
                className={`px-3 py-1 rounded text-[11px] italic font-bold text-left ${active ? 'text-yellow-300' : 'text-white/70'}`}
                style={{ fontFamily: 'Georgia, serif' }}>
                {fmt(b)}
              </button>
            );
          })}
          <div className="pt-1 mt-0.5" style={{ borderTop: '1px solid rgba(214,178,98,0.25)' }}>
            <div className="text-[8px] text-white/45 tracking-widest mb-1 px-1" style={{ fontFamily: 'Georgia, serif' }}>CUSTOM</div>
            <div className="flex items-center gap-1">
              <span className="text-amber-300 text-[12px] font-black" style={{ fontFamily: 'Georgia, serif' }}>$</span>
              <input type="number" inputMode="decimal" step="0.25" min={minBet} max={maxBet} defaultValue={bet} key={bet}
                onBlur={(e) => setCustomBet(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCustomBet(e.target.value); setShowBetMenu(false); } }}
                className="w-20 px-2 py-1 rounded text-[11px] font-bold text-yellow-300 tabular-nums outline-none"
                style={{ fontFamily: 'Georgia, serif', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(214,178,98,0.5)' }} />
              <button onClick={(e) => { setCustomBet(e.currentTarget.previousSibling.value); setShowBetMenu(false); }}
                className="px-2 py-1 rounded text-[10px] font-black italic"
                style={{ fontFamily: 'Georgia, serif', color: '#ffe9a8', background: 'linear-gradient(to bottom,#8b4513,#4a280a)', border: '1px solid rgba(255,234,160,0.7)' }}>
                SET
              </button>
            </div>
            <div className="text-[8px] text-white/35 mt-1 px-1" style={{ fontFamily: 'Georgia, serif' }}>Min {fmt(minBet)} · Max {fmt(maxBet)}</div>
          </div>
        </div>
      )}

      {/* Control panel */}
      <div className="relative px-3 pt-2 pb-1 z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2 items-center">
            <button onClick={() => setTurbo((t) => !t)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ border: `1.5px solid ${turbo ? 'rgba(255,234,120,0.9)' : 'rgba(214,178,98,0.45)'}`, background: turbo ? 'rgba(255,200,80,0.18)' : 'rgba(8,18,38,0.85)', boxShadow: turbo ? '0 0 10px rgba(255,200,80,0.4)' : 'none' }}>
              <Zap className={`w-4 h-4 ${turbo ? 'text-yellow-300' : 'text-amber-200/70'}`} fill={turbo ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowBetMenu((s) => !s)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}>
              <Menu className="w-4 h-4 text-amber-200/70" />
            </button>
          </div>

          <button onClick={spin} disabled={spinning} className="relative w-16 h-16 rounded-full disabled:opacity-70 active:scale-95 transition-transform flex items-center justify-center"
            style={{ background: spinning ? 'radial-gradient(circle,#4a5a6a,#2a3a4a)' : 'radial-gradient(circle at 35% 30%, #ffffff, #e8edf2 60%, #c0c8d0 100%)', border: '2px solid rgba(255,255,255,0.5)', boxShadow: spinning ? 'none' : '0 0 16px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.5)' }}>
            {freeSpinsActive ? (
              <span className="text-lg font-black text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>{freeSpins}</span>
            ) : (
              <Play className="w-6 h-6 text-slate-800" fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          <div className="flex flex-col gap-2 items-center">
            <button onClick={() => { const idx = BETS.findIndex((b) => Math.abs(bet - b) < 0.001); if (idx >= 0 && idx < BETS.length - 1) setBet(BETS[idx + 1]); else setCustomBet(bet + 1); }} disabled={spinning}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform" style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}>
              <Plus className="w-4 h-4 text-amber-200/70" />
            </button>
            <button onClick={() => setAutoSpin((a) => !a)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ border: `1.5px solid ${autoSpin ? 'rgba(120,220,160,0.9)' : 'rgba(214,178,98,0.45)'}`, background: autoSpin ? 'rgba(60,200,120,0.18)' : 'rgba(8,18,38,0.85)', boxShadow: autoSpin ? '0 0 10px rgba(60,200,120,0.35)' : 'none' }}>
              <Repeat className={`w-4 h-4 ${autoSpin ? 'text-emerald-300' : 'text-amber-200/70'}`} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: '1.5px solid rgba(214,178,98,0.45)', background: 'rgba(8,18,38,0.85)' }}>
              <DollarSign className="w-4 h-4 text-amber-200/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="relative mx-2 mb-2 rounded-[8px] overflow-hidden z-10" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(5,12,28,0.92)' }}>
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
            <div className="text-[8px] text-white/45 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>PAYS</div>
            <div className="text-[11px] font-black tabular-nums text-white" style={{ fontFamily: 'Georgia, serif' }}>8+</div>
          </div>
        </div>
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
        <div className="text-center text-[9px] text-amber-200/70 italic py-0.5" style={{ fontFamily: 'Georgia, serif', borderTop: '1px solid rgba(214,178,98,0.18)' }}>
          {freeSpinsActive ? `FREE SPINS · ${freeSpins} LEFT · MULT ×${spinMult || 1}` : message}
        </div>
      </div>
    </div>
  );
}

function GatesInfo({ bet, onClose }) {
  const rows = [
    ['zeus', 2, 5, 10, 20],
    ['crown', 1.5, 3, 6, 12],
    ['hourglass', 1, 2, 4, 8],
    ['ring', 0.8, 1.5, 3, 6],
    ['goblet', 0.5, 1, 2, 4],
    ['red', 0.25, 0.5, 1, 2],
    ['blue', 0.25, 0.5, 1, 2],
    ['green', 0.25, 0.5, 1, 2],
    ['yellow', 0.25, 0.5, 1, 2],
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-[10px] p-3 max-h-[85vh] overflow-y-auto" style={{ background: 'linear-gradient(to bottom,#0a1530,#050a1c)', border: '1px solid rgba(214,178,98,0.5)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-black italic" style={{ fontFamily: 'Rye, Georgia, serif', color: '#ffe9a8' }}>PAYTABLE</h3>
          <X className="w-5 h-5 text-amber-200/70" onClick={onClose} />
        </div>
        <p className="text-[10px] text-amber-200/70 italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          8+ matching symbols anywhere on the grid pay. Winning symbols tumble; new ones drop. Multiplier symbols (×2–×500) stick and sum. 4+ scatters award 15 free spins where multipliers accumulate.
        </p>
        <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-amber-200/60 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          <div>SYM</div><div>8-11</div><div>12-14</div><div>15-19</div><div>20+</div>
        </div>
        {rows.map(([sym, ...p]) => (
          <div key={sym} className="grid grid-cols-5 gap-1 text-[10px] py-0.5" style={{ fontFamily: 'Georgia, serif', borderBottom: '1px solid rgba(214,178,98,0.12)' }}>
            <div className="flex items-center gap-1"><span className="text-base">{SYMBOLS[sym].emoji}</span></div>
            {p.map((v, i) => <div key={i} className="text-yellow-300 tabular-nums">×{v}</div>)}
          </div>
        ))}
        <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ fontFamily: 'Georgia, serif' }}>
          <span className="text-base">🔱</span>
          <span className="text-amber-200/80">4+ Scatters → 15 Free Spins</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ fontFamily: 'Georgia, serif' }}>
          <span className="text-base">⚡</span>
          <span className="text-amber-200/80">Multipliers: ×{MULTIPLIERS[0].v} to ×{MULTIPLIERS[MULTIPLIERS.length - 1].v}</span>
        </div>
        <div className="mt-2 text-[10px] text-white/50 italic" style={{ fontFamily: 'Georgia, serif' }}>Current bet: {fmt(bet)} · pays are ×bet</div>
      </div>
    </div>
  );
}