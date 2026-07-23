import React, { useState, useEffect, useRef } from 'react';
import { useArgonauts } from './useArgonauts';
import { REELS, ROWS, SYMBOLS, PAYTABLE, PAYLINES, SCATTER_PAY, BETS, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT } from './argonautsEngine';

const BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png';

function SymTile({ sym, spinning, win, size = 'md' }) {
  const meta = SYMBOLS[sym] || SYMBOLS.bow;
  const isSpecial = meta.kind === 'wild' || meta.kind === 'scatter' || meta.kind === 'bonus';
  const dim = size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';
  return (
    <div
      className={`relative flex items-center justify-center rounded-[10px] transition-all duration-300 ${dim}`}
      style={{
        background: isSpecial
          ? 'radial-gradient(circle at 50% 40%, rgba(245,215,122,0.28), rgba(20,17,13,0.85) 70%)'
          : 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06), rgba(10,16,24,0.82) 70%)',
        border: win
          ? '1.5px solid rgba(245,215,122,0.95)'
          : '1px solid rgba(214,178,98,0.18)',
        boxShadow: win ? '0 0 14px rgba(245,215,122,0.7), inset 0 0 10px rgba(245,215,122,0.25)' : 'inset 0 0 8px rgba(0,0,0,0.4)',
        filter: spinning ? 'blur(1.5px) brightness(0.85)' : 'none',
        fontFamily: 'Georgia, serif',
      }}
    >
      <span style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))' }}>{meta.emoji}</span>
    </div>
  );
}

function Reel({ reel, reelIndex, spinningReels, winningPositions }) {
  const spinning = spinningReels.has(reelIndex);
  return (
    <div className="flex flex-col gap-1.5">
      {reel.map((sym, row) => {
        const win = winningPositions.has(`${reelIndex}-${row}`);
        return (
          <div
            key={row}
            className="relative overflow-hidden"
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              animation: spinning ? 'ccReelSpin 0.18s linear infinite' : undefined,
            }}
          >
            <SymTile sym={sym} spinning={spinning} win={win} />
          </div>
        );
      })}
    </div>
  );
}

export default function ArgonautsMachine() {
  const g = useArgonauts();
  const [showPaytable, setShowPaytable] = useState(false);
  const [bonusStepIndex, setBonusStepIndex] = useState(0);

  // Animate bonus steps
  useEffect(() => {
    if (g.bonusActive && g.bonusSteps.length) {
      setBonusStepIndex(0);
      let i = 0;
      const iv = setInterval(() => {
        i++;
        if (i < g.bonusSteps.length) setBonusStepIndex(i);
        else clearInterval(iv);
      }, 700);
      return () => clearInterval(iv);
    }
  }, [g.bonusActive, g.bonusSteps]);

  const decBet = () => !g.spinning && g.betIndex > 0 && g.setBetIndex(g.betIndex - 1);
  const incBet = () => !g.spinning && g.betIndex < BETS.length - 1 && g.setBetIndex(g.betIndex + 1);

  return (
    <div className="relative">
      {/* Game frame with Greek background */}
      <div
        className="relative rounded-[14px] overflow-hidden"
        style={{
          border: '2px solid rgba(214,178,98,0.55)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 18px 40px rgba(0,0,0,0.65), inset 0 0 30px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.55) saturate(1.1)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,13,20,0.45), rgba(7,13,20,0.82))' }} />

        <div className="relative px-3 pt-3 pb-2">
          {/* Status bar */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-[6px] text-[10px] font-black tracking-wide"
                style={{ fontFamily: 'Georgia, serif', border: '1px solid rgba(214,178,98,0.4)', background: 'rgba(20,17,13,0.6)', color: '#e8c878' }}
              >
                BET ${g.bet.toFixed(2)}
              </span>
              <span className="text-[10px] text-amber-200/50" style={{ fontFamily: 'Georgia, serif' }}>10 LINES</span>
            </div>
            {g.freeSpins > 0 && (
              <span
                className="px-2 py-0.5 rounded-[6px] text-[10px] font-black tracking-wide animate-pulse"
                style={{ fontFamily: 'Georgia, serif', border: '1px solid rgba(245,215,122,0.7)', background: 'rgba(245,215,122,0.18)', color: '#f5d77a' }}
              >
                ⛵ {g.freeSpins} FREE SPINS
              </span>
            )}
            {g.lastWin > 0 && g.freeSpins === 0 && (
              <span className="text-sm font-black tabular-nums text-yellow-200" style={{ fontFamily: 'Georgia, serif' }}>
                WIN ${g.lastWin.toFixed(2)}
              </span>
            )}
          </div>

          {/* Reel grid */}
          <div
            className="relative grid gap-1.5 rounded-[10px] p-2"
            style={{
              gridTemplateColumns: `repeat(${REELS}, 1fr)`,
              background: 'rgba(7,13,20,0.55)',
              border: '1px solid rgba(214,178,98,0.3)',
            }}
          >
            {g.grid.map((reel, ri) => (
              <Reel key={ri} reel={reel} reelIndex={ri} spinningReels={g.spinningReels} winningPositions={g.winningPositions} />
            ))}
          </div>

          {/* Message strip */}
          <div className="mt-2 text-center">
            <p className="text-xs sm:text-sm font-bold tracking-wide text-amber-100/90" style={{ fontFamily: 'Georgia, serif' }}>
              {g.message}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="relative px-3 pb-3 pt-1 flex items-center justify-between gap-2">
          <button
            onClick={decBet}
            disabled={g.spinning || g.betIndex === 0}
            className="w-9 h-9 rounded-[8px] text-lg font-black disabled:opacity-40"
            style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.7)', color: '#e8c878' }}
          >−</button>
          <div className="text-center flex-1">
            <p className="text-[9px] text-amber-200/50 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>TOTAL BET</p>
            <p className="text-base font-black tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>${g.bet.toFixed(2)}</p>
          </div>

          <button
            onClick={g.spin}
            disabled={g.spinning || g.freeSpinsActive || g.bonusActive || g.riskMode}
            className="px-5 sm:px-7 h-12 rounded-[10px] text-base font-black tracking-wider transition-all active:scale-95 disabled:opacity-60"
            style={{
              fontFamily: 'Georgia, serif',
              border: '2px solid rgba(245,215,122,0.85)',
              background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
              color: '#2a1a06',
              boxShadow: '0 0 18px rgba(245,215,122,0.45)',
            }}
          >
            {g.freeSpinsActive ? 'AUTO' : 'SPIN'}
          </button>

          <button
            onClick={incBet}
            disabled={g.spinning || g.betIndex === BETS.length - 1}
            className="w-9 h-9 rounded-[8px] text-lg font-black disabled:opacity-40"
            style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.7)', color: '#e8c878' }}
          >+</button>
        </div>

        {/* Secondary controls */}
        <div className="relative px-3 pb-3 flex items-center justify-center gap-2">
          <ToggleBtn active={g.autoSpin} onClick={() => g.setAutoSpin(!g.autoSpin)} disabled={g.spinning || g.freeSpinsActive}>AUTO</ToggleBtn>
          <ToggleBtn active={g.turbo} onClick={() => g.setTurbo(!g.turbo)} disabled={g.spinning}>TURBO</ToggleBtn>
          <ToggleBtn active={showPaytable} onClick={() => setShowPaytable(!showPaytable)}>PAYTABLE</ToggleBtn>
          {g.riskActive && (
            <button
              onClick={g.startRisk}
              className="px-3 py-1.5 rounded-[8px] text-xs font-black tracking-wide animate-pulse"
              style={{ fontFamily: 'Georgia, serif', border: '1px solid rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}
            >
              RISK ×2
            </button>
          )}
        </div>
      </div>

      {/* Risk (gamble) overlay */}
      {g.riskMode && (
        <Overlay onClose={null}>
          <div className="text-center">
            <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>CLASSIC RISK GAME</h2>
            <p className="text-xs text-amber-200/70 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Guess the card color to double your winnings (up to 10×)
            </p>
            <div className="mb-3">
              <p className="text-[10px] text-amber-200/50 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>CURRENT POT</p>
              <p className="text-3xl font-black tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>${g.pendingWin.toFixed(2)}</p>
              {g.riskStep > 0 && <p className="text-xs text-emerald-300 mt-1" style={{ fontFamily: 'Georgia, serif' }}>Step {g.riskStep} / 10</p>}
            </div>
            {g.riskHistory.length > 0 && (
              <div className="flex justify-center gap-1.5 mb-4">
                {g.riskHistory.map((c, i) => (
                  <span key={i} className={`w-7 h-10 rounded-[5px] flex items-center justify-center text-xs font-black ${c === 'red' ? 'bg-red-600/80 text-red-100' : 'bg-stone-800 text-stone-100'}`} style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
                    {c === 'red' ? '♥' : '♠'}
                  </span>
                ))}
              </div>
            )}

            {g.riskResult === 'lose' ? (
              <div>
                <p className="text-lg font-black text-red-400 mb-3" style={{ fontFamily: 'Georgia, serif' }}>YOU LOST!</p>
                <button onClick={g.loseRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.8)', color: '#e8c878' }}>CONTINUE</button>
              </div>
            ) : g.riskResult === 'maxed' ? (
              <div>
                <p className="text-lg font-black text-yellow-300 mb-3" style={{ fontFamily: 'Georgia, serif' }}>MAX 10× REACHED!</p>
                <button onClick={g.collectRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(245,215,122,0.7)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>COLLECT ${g.pendingWin.toFixed(2)}</button>
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => g.riskPick('red')}
                  className="flex-1 max-w-[140px] py-3 rounded-[8px] font-black text-base"
                  style={{ border: '1px solid rgba(239,68,68,0.7)', background: 'linear-gradient(to bottom,#dc2626,#7f1d1d)', color: '#fee2e2' }}
                >RED ♥</button>
                <button
                  onClick={() => g.riskPick('black')}
                  className="flex-1 max-w-[140px] py-3 rounded-[8px] font-black text-base"
                  style={{ border: '1px solid rgba(120,113,108,0.8)', background: 'linear-gradient(to bottom,#44403c,#1c1917)', color: '#e7e5e4' }}
                >BLACK ♠</button>
              </div>
            )}

            <div className="mt-4 flex justify-center gap-3">
              <button onClick={g.collectRisk} className="text-xs underline text-amber-300/80" style={{ fontFamily: 'Georgia, serif' }}>Take winnings</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Free spins start overlay */}
      {g.showFreeSpinStart && (
        <Overlay onClose={null}>
          <div className="text-center">
            <div className="text-6xl mb-3">⛵</div>
            <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>FREE SPINS</h2>
            <p className="text-lg text-yellow-100 mb-4" style={{ fontFamily: 'Georgia, serif' }}>{FREE_SPINS_AWARD} free games awarded!</p>
            <p className="text-xs text-amber-200/60 mb-5" style={{ fontFamily: 'Georgia, serif' }}>Only Wild, Scatter, Bonus & top symbols appear</p>
            <button
              onClick={g.startFreeSpins}
              className="px-8 py-3 rounded-[10px] font-black tracking-wider"
              style={{ border: '2px solid rgba(245,215,122,0.85)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}
            >
              START
            </button>
          </div>
        </Overlay>
      )}

      {/* Golden Fleece bonus overlay */}
      {g.bonusActive && (
        <Overlay onClose={null}>
          <div className="text-center w-full">
            <div className="text-5xl mb-2">🛡️</div>
            <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>GOLDEN FLEECE BONUS</h2>
            <p className="text-xs text-amber-200/60 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Hold & Spin · lock shields for prizes</p>
            <div className="grid grid-cols-5 gap-1.5 max-w-[340px] mx-auto mb-3">
              {(g.bonusSteps[bonusStepIndex] || Array(15).fill(null)).map((cell, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[6px] flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: cell ? 'radial-gradient(circle, rgba(245,215,122,0.3), rgba(20,17,13,0.85))' : 'rgba(20,17,13,0.6)',
                    border: cell ? '1px solid rgba(245,215,122,0.8)' : '1px solid rgba(214,178,98,0.2)',
                    boxShadow: cell ? '0 0 8px rgba(245,215,122,0.4)' : 'none',
                  }}
                >
                  {cell ? (
                    <div className="flex flex-col items-center">
                      <span>{cell.emoji}</span>
                      {cell.prize > 0 && <span className="text-[8px] text-yellow-200 font-black">{cell.prize}×</span>}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="text-sm text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>
              Bonus Prize: <span className="font-black tabular-nums">${g.bonusPrize.toFixed(2)}</span>
              {g.bonusExtra && <span className="ml-2 text-yellow-300 animate-pulse">ULTRA JACKPOT!</span>}
            </p>
            {bonusStepIndex >= g.bonusSteps.length - 1 && (
              <button
                onClick={g.finishBonus}
                className="mt-4 px-6 py-2 rounded-[8px] font-black"
                style={{ border: '2px solid rgba(245,215,122,0.85)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}
              >
                COLLECT ${g.bonusPrize.toFixed(2)}
              </button>
            )}
          </div>
        </Overlay>
      )}

      {/* Paytable overlay */}
      {showPaytable && (
        <Overlay onClose={() => setShowPaytable(false)}>
          <div className="w-full max-w-md">
            <h2 className="text-center text-lg font-black mb-3" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>PAYTABLE</h2>
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {Object.values(SYMBOLS).filter(s => s.kind === 'high' || s.kind === 'low' || s.kind === 'wild').map(s => {
                const pt = PAYTABLE[s.id];
                return (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-[6px]" style={{ border: '1px solid rgba(214,178,98,0.25)', background: 'rgba(20,17,13,0.6)' }}>
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <p className="text-[10px] text-amber-200/70" style={{ fontFamily: 'Georgia, serif' }}>{s.name}</p>
                      <p className="text-[10px] tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>
                        {pt[0]}× / {pt[1]}× / {pt[2]}× <span className="text-amber-200/50">line</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="col-span-2 p-2 rounded-[6px] text-center" style={{ border: '1px solid rgba(214,178,98,0.25)', background: 'rgba(20,17,13,0.6)' }}>
                <span className="text-2xl">⛵</span>
                <p className="text-[10px] text-amber-200/70 mt-1" style={{ fontFamily: 'Georgia, serif' }}>3 Scatters on reels 2–4 → {FREE_SPINS_AWARD} Free Spins · pays {SCATTER_PAY}× bet</p>
              </div>
              <div className="col-span-2 p-2 rounded-[6px] text-center" style={{ border: '1px solid rgba(214,178,98,0.25)', background: 'rgba(20,17,13,0.6)' }}>
                <span className="text-2xl">🛡️</span>
                <p className="text-[10px] text-amber-200/70 mt-1" style={{ fontFamily: 'Georgia, serif' }}>{BONUS_TRIGGER_COUNT}+ Bonus symbols → Golden Fleece Bonus (jackpots up to 5000×)</p>
              </div>
            </div>
            <button onClick={() => setShowPaytable(false)} className="mt-3 w-full py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.8)', color: '#e8c878' }}>CLOSE</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-[8px] text-[11px] font-black tracking-wide transition-colors disabled:opacity-40"
      style={{
        fontFamily: 'Georgia, serif',
        border: active ? '1px solid rgba(245,215,122,0.8)' : '1px solid rgba(214,178,98,0.35)',
        background: active ? 'rgba(245,215,122,0.22)' : 'rgba(20,17,13,0.6)',
        color: active ? '#f5d77a' : '#e8c878',
      }}
    >
      {children}
    </button>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full text-amber-200" style={{ border: '1px solid rgba(214,178,98,0.4)', background: 'rgba(20,17,13,0.8)' }}>✕</button>
      )}
      <div className="w-full max-w-md rounded-[12px] p-5" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'linear-gradient(to bottom, rgba(20,17,13,0.95), rgba(7,13,20,0.95))' }}>
        {children}
      </div>
    </div>
  );
}