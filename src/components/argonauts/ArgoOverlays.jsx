import React, { useState, useEffect } from 'react';
import { SYMBOLS, PAYTABLE, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, SCATTER_PAY } from './argonautsEngine';

// Centered modal overlay over the game.
function Overlay({ children, onClose }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full text-amber-200" style={{ border: '1px solid rgba(214,178,98,0.4)', background: 'rgba(20,17,13,0.8)' }}>✕</button>
      )}
      <div className="w-full max-w-md rounded-[12px] p-5" style={{ border: '1px solid rgba(255,215,0,0.5)', background: 'linear-gradient(to bottom, rgba(20,17,13,0.96), rgba(7,13,20,0.96))' }}>
        {children}
      </div>
    </div>
  );
}

export default function ArgoOverlays({ g, showPaytable, setShowPaytable }) {
  const [bonusStepIndex, setBonusStepIndex] = useState(0);

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

  return (
    <>
      {/* Risk (gamble) overlay */}
      {g.riskMode && (
        <Overlay onClose={null}>
          <div className="text-center">
            <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>CLASSIC RISK GAME</h2>
            <p className="text-xs text-amber-200/70 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Guess the card color to double your winnings (up to 10×)</p>
            <p className="text-[10px] text-amber-200/50 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>CURRENT POT</p>
            <p className="text-3xl font-black tabular-nums text-yellow-100 mb-1" style={{ fontFamily: 'Georgia, serif' }}>${g.pendingWin.toFixed(2)}</p>
            {g.riskStep > 0 && <p className="text-xs text-emerald-300 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Step {g.riskStep} / 10</p>}
            {g.riskHistory.length > 0 && (
              <div className="flex justify-center gap-1.5 mb-4">
                {g.riskHistory.map((c, i) => (
                  <span key={i} className={`w-7 h-10 rounded-[5px] flex items-center justify-center text-xs font-black ${c === 'red' ? 'bg-red-600/80 text-red-100' : 'bg-stone-800 text-stone-100'}`} style={{ border: '1px solid rgba(214,178,98,0.4)' }}>{c === 'red' ? '♥' : '♠'}</span>
                ))}
              </div>
            )}
            {g.riskResult === 'lose' ? (
              <button onClick={g.loseRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.8)', color: '#e8c878' }}>CONTINUE</button>
            ) : g.riskResult === 'maxed' ? (
              <button onClick={g.collectRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(245,215,122,0.7)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>COLLECT ${g.pendingWin.toFixed(2)}</button>
            ) : (
              <div className="flex justify-center gap-3">
                <button onClick={() => g.riskPick('red')} className="flex-1 max-w-[140px] py-3 rounded-[8px] font-black text-base" style={{ border: '1px solid rgba(239,68,68,0.7)', background: 'linear-gradient(to bottom,#dc2626,#7f1d1d)', color: '#fee2e2' }}>RED ♥</button>
                <button onClick={() => g.riskPick('black')} className="flex-1 max-w-[140px] py-3 rounded-[8px] font-black text-base" style={{ border: '1px solid rgba(120,113,108,0.8)', background: 'linear-gradient(to bottom,#44403c,#1c1917)', color: '#e7e5e4' }}>BLACK ♠</button>
              </div>
            )}
            <div className="mt-4"><button onClick={g.collectRisk} className="text-xs underline text-amber-300/80" style={{ fontFamily: 'Georgia, serif' }}>Take winnings</button></div>
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
            <button onClick={g.startFreeSpins} className="px-8 py-3 rounded-[10px] font-black tracking-wider" style={{ border: '2px solid rgba(245,215,122,0.85)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>START</button>
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
                <div key={i} className="aspect-square rounded-[6px] flex items-center justify-center text-2xl transition-all" style={{ background: cell ? 'radial-gradient(circle, rgba(245,215,122,0.3), rgba(20,17,13,0.85))' : 'rgba(20,17,13,0.6)', border: cell ? '1px solid rgba(245,215,122,0.8)' : '1px solid rgba(214,178,98,0.2)', boxShadow: cell ? '0 0 8px rgba(245,215,122,0.4)' : 'none' }}>
                  {cell ? (<div className="flex flex-col items-center"><span>{cell.emoji}</span>{cell.prize > 0 && <span className="text-[8px] text-yellow-200 font-black">{cell.prize}×</span>}</div>) : null}
                </div>
              ))}
            </div>
            <p className="text-sm text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>Bonus Prize: <span className="font-black tabular-nums">${g.bonusPrize.toFixed(2)}</span>{g.bonusExtra && <span className="ml-2 text-yellow-300 animate-pulse">ULTRA JACKPOT!</span>}</p>
            {bonusStepIndex >= g.bonusSteps.length - 1 && (
              <button onClick={g.finishBonus} className="mt-4 px-6 py-2 rounded-[8px] font-black" style={{ border: '2px solid rgba(245,215,122,0.85)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>COLLECT ${g.bonusPrize.toFixed(2)}</button>
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
                      <p className="text-[10px] tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>{pt[0]}× / {pt[1]}× / {pt[2]}× <span className="text-amber-200/50">line</span></p>
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

    </>
  );
}