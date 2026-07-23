import React, { useState, useEffect } from 'react';
import { SYMBOLS, PAYTABLE, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, SCATTER_PAY } from './argonautsEngine';
import FreeGamesBanner from './FreeGamesBanner';

const COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b4e358bc4_generated_image.png';

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

      {/* Free Games trigger banner */}
      {g.showFreeSpinStart && (
        <FreeGamesBanner count={FREE_SPINS_AWARD} onStart={g.startFreeSpins} />
      )}

      {/* Golden Fleece bonus overlay — hold & spin coin round */}
      {g.bonusActive && (
        <Overlay onClose={null}>
          <div className="text-center w-full">
            <h2 className="text-lg font-black mb-2" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>GOLDEN FLEECE BONUS</h2>

            {/* Heart meter + jackpot tiers */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-red-500 text-lg">❤</span>
              <div className="flex gap-1 flex-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-2 flex-1 rounded-[3px]" style={{ background: i === 0 ? 'linear-gradient(to right,#ef4444,#b91c1c)' : 'rgba(214,178,98,0.18)', border: '1px solid rgba(214,178,98,0.4)' }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-w-[340px] mx-auto mb-3">
              {[
                { k: 'ULTRA', v: 5000 * g.bet, c: '#a855f7', bg: 'rgba(88,28,135,0.85)' },
                { k: 'MAX', v: 150 * g.bet, c: '#ef4444', bg: 'rgba(127,29,29,0.85)' },
                { k: 'MID', v: 50 * g.bet, c: '#3b82f6', bg: 'rgba(30,58,138,0.85)' },
                { k: 'MIN', v: 20 * g.bet, c: '#22c55e', bg: 'rgba(20,83,45,0.85)' },
              ].map((t) => (
                <div key={t.k} className="rounded-[5px] py-1 px-0.5" style={{ border: `1px solid ${t.c}`, background: t.bg }}>
                  <p className="text-[8px] font-black tracking-wider" style={{ color: t.c }}>{t.k}</p>
                  <p className="text-[10px] font-black tabular-nums text-white">€{t.v.toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Coin grid */}
            <div className="grid grid-cols-5 gap-1.5 max-w-[340px] mx-auto mb-3">
              {(g.bonusSteps[bonusStepIndex] || Array(15).fill(null)).map((cell, i) => (
                <div key={i} className="relative aspect-square rounded-[6px] flex items-center justify-center transition-all overflow-hidden" style={{ background: cell && cell.prize > 0 ? 'radial-gradient(circle, rgba(120,30,30,0.9), rgba(40,8,8,0.95))' : 'rgba(74,4,4,0.85)', border: cell && cell.prize > 0 ? '1px solid rgba(255,215,0,0.85)' : '1px solid rgba(214,178,98,0.25)', boxShadow: cell && cell.prize > 0 ? '0 0 10px rgba(255,215,0,0.55)' : 'none' }}>
                  {cell && cell.prize > 0 ? (
                    <>
                      <img src={COIN_IMG} alt="coin" className="w-full h-full object-cover" draggable={false} />
                      <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums" style={{ fontSize: '11px', color: '#3E2723', textShadow: '0 1px 1px rgba(255,235,150,0.6)' }}>
                        €{(cell.prize * g.bet).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <div className="w-[70%] h-[70%] rounded-full" style={{ border: '1px solid rgba(214,178,98,0.25)', background: 'radial-gradient(circle, rgba(60,10,10,0.6), transparent 70%)' }} />
                  )}
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