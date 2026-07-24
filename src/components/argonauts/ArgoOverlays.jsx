import React, { useState, useEffect } from 'react';
import { SYMBOLS, PAYTABLE, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, SCATTER_PAY } from './argonautsEngine';
import FreeGamesBanner from './FreeGamesBanner';
import GoldenFleeceBanner from './GoldenFleeceBanner';
import ArgoPaytable from './ArgoPaytable';
import ArgoRules from './ArgoRules';

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

export default function ArgoOverlays({ g, showPaytable, setShowPaytable, showRules, setShowRules }) {
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
      {/* Risk (gamble) overlay — card based */}
      {g.riskMode && (
        <Overlay onClose={null}>
          <div className="text-center">
            <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f5d77a' }}>RISK GAME</h2>
            <p className="text-xs text-amber-200/70 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Beat the Dealer's card to double your winnings (up to 10 attempts)</p>
            <p className="text-[10px] text-amber-200/50 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>CURRENT WIN</p>
            <p className="text-3xl font-black tabular-nums text-yellow-100 mb-2" style={{ fontFamily: 'Georgia, serif' }}>${g.pendingWin.toFixed(2)}</p>
            <p className="text-xs text-amber-200/80 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Attempt {Math.min(g.riskStep + 1, 10)} / 10</p>

            {/* Dealer card */}
            <div className="flex flex-col items-center mb-3">
              <p className="text-[9px] tracking-widest text-amber-200/60 mb-1" style={{ fontFamily: 'Georgia, serif' }}>DEALER</p>
              <div className="w-14 h-20 rounded-[6px] flex items-center justify-center font-black text-2xl" style={{ border: '1.5px solid rgba(255,215,0,0.7)', background: 'linear-gradient(to bottom,#fff7e0,#e9d9a6)', color: '#3a2a10', boxShadow: '0 0 10px rgba(255,215,0,0.4)' }}>
                {g.dealerCard || '—'}
              </div>
            </div>

            {/* Pick feedback */}
            {g.riskOutcome && (
              <p className="text-sm font-black mb-2" style={{ fontFamily: 'Georgia, serif', color: g.riskOutcome === 'win' ? '#86efac' : g.riskOutcome === 'draw' ? '#fcd34d' : '#fca5a5' }}>
                {g.riskOutcome === 'win' ? `DOUBLE! $${g.pendingWin.toFixed(2)}` : g.riskOutcome === 'draw' ? 'DRAW · RETRY' : 'DEALER WINS'}
              </p>
            )}

            {/* Player cards */}
            <div className="flex justify-center gap-2 mb-3">
              {g.playerCards.map((c, i) => {
                const revealed = g.revealedIdx === i;
                const isJoker = c === 'JOKER';
                return (
                  <button
                    key={i}
                    onClick={() => !g.riskOutcome && g.riskPick(i)}
                    disabled={!!g.riskOutcome}
                    className="w-14 h-20 rounded-[6px] flex items-center justify-center font-black text-xl transition-all active:scale-95 disabled:cursor-default"
                    style={{
                      border: revealed ? '1.5px solid rgba(255,215,0,0.9)' : '1.5px solid rgba(214,178,98,0.4)',
                      background: revealed
                        ? (isJoker ? 'linear-gradient(to bottom,#fde68a,#f59e0b)' : 'linear-gradient(to bottom,#fff7e0,#e9d9a6)')
                        : 'linear-gradient(to bottom,#3a2a1a,#1c1408)',
                      color: revealed ? '#3a2a10' : '#c9a85a',
                      boxShadow: revealed ? '0 0 12px rgba(255,215,0,0.7)' : 'none',
                    }}
                  >
                    {revealed ? (isJoker ? '★' : c) : '?'}
                  </button>
                );
              })}
            </div>

            {/* History of picked cards */}
            {g.riskHistory.length > 0 && (
              <div className="flex justify-center gap-1 mb-3 flex-wrap">
                {g.riskHistory.map((c, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-black" style={{ border: '1px solid rgba(214,178,98,0.4)', background: 'rgba(20,17,13,0.8)', color: c === 'JOKER' ? '#fcd34d' : '#e8c878' }}>{c === 'JOKER' ? '★' : c}</span>
                ))}
              </div>
            )}

            {g.riskResult === 'lose' ? (
              <button onClick={g.loseRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.8)', color: '#e8c878' }}>CONTINUE</button>
            ) : g.riskResult === 'maxed' ? (
              <button onClick={g.collectRisk} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(245,215,122,0.7)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>COLLECT ${g.pendingWin.toFixed(2)}</button>
            ) : g.riskOutcome === 'win' ? (
              <button onClick={g.riskContinue} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(134,239,172,0.6)', background: 'linear-gradient(to bottom,#16a34a,#14532d)', color: '#dcfce7' }}>CONTINUE</button>
            ) : g.riskOutcome === 'draw' ? (
              <button onClick={g.riskContinue} className="px-6 py-2 rounded-[8px] font-black" style={{ border: '1px solid rgba(252,211,77,0.6)', background: 'rgba(20,17,13,0.8)', color: '#fcd34d' }}>RETRY</button>
            ) : (
              <p className="text-xs text-amber-200/60" style={{ fontFamily: 'Georgia, serif' }}>Pick a card to beat the Dealer</p>
            )}
            <div className="mt-4"><button onClick={g.collectRisk} className="text-xs underline text-amber-300/80" style={{ fontFamily: 'Georgia, serif' }}>TAKE WIN</button></div>
          </div>
        </Overlay>
      )}

      {/* Free Games trigger banner */}
      {g.showFreeSpinStart && (
        <FreeGamesBanner count={FREE_SPINS_AWARD} onStart={g.startFreeSpins} />
      )}

      {/* Golden Fleece coin-feature trigger banner — click to start coin spins */}
      {g.showCoinBanner && (
        <GoldenFleeceBanner count={g.coinTriggerCount || 5} onStart={g.beginCoinSpins} />
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

      {/* Rules + Paylines overlay */}
      {showRules && (
        <Overlay onClose={() => setShowRules(false)}>
          <ArgoRules onClose={() => setShowRules(false)} />
        </Overlay>
      )}

      {/* Paytable overlay */}
      {showPaytable && (
        <Overlay onClose={() => setShowPaytable(false)}>
          <ArgoPaytable bet={g.bet} onClose={() => setShowPaytable(false)} />
        </Overlay>
      )}

    </>
  );
}