import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { SYMBOLS, BETS } from '@/lib/bigBrownEngine';

// Info / Paytable overlay matching the reference screenshots.
// Multi-page: Paytable → Wild & Free Games → Risk Game → Rules → Bonus Pop.
const PAGES = ['PAYTABLE', 'WILD & FREE GAMES', 'RISK GAME', 'RULES', 'BONUS POP'];

// Symbols shown in paytable order (high → low → scatter).
const PAYTABLE_ORDER = [
  'buffalo', 'eagle', 'cougar', 'wolf', 'deer',
  'A', 'K', 'Q', 'J', '10', '9',
  'scatter',
];

export default function BigBrownInfo({ bet = 0.50, onClose }) {
  const [page, setPage] = useState(0);
  const betUnit = bet / 20;

  const fmt = (v) => `€${v.toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#000000' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: '#000', borderBottom: '1px solid rgba(214,178,98,0.2)' }}>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(214,178,98,0.5)' }}>
          <X className="w-4 h-4 text-amber-300" />
        </button>
        <h1
          className="text-xl italic font-black"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom,#f5c542,#8b5a2b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          BIG BROWN
        </h1>
        <div className="w-8" />
      </div>

      <div className="px-4 py-3 max-w-lg mx-auto">
        {/* Page title */}
        <h2 className="text-center text-lg font-black text-yellow-400 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          {PAGES[page]}
        </h2>

        {/* Page 0: Paytable */}
        {page === 0 && (
          <div className="space-y-2">
            {PAYTABLE_ORDER.map(id => {
              const s = SYMBOLS[id];
              const isScatter = id === 'scatter';
              const vals = [6, 5, 4, 3].map(n => {
                const pay = isScatter ? s.pay[n] * bet : s.pay[n] * betUnit;
                return fmt(pay);
              });
              return (
                <div key={id} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="w-12 h-12 rounded-[5px] overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(214,178,98,0.3)' }}>
                    <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-white/70 w-14 flex-shrink-0" style={{ fontFamily: 'Georgia, serif' }}>
                    {s.label}
                  </span>
                  <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                    {vals.map((v, i) => (
                      <div key={i}>
                        <span className="block text-[8px] text-yellow-400/60">{[6, 5, 4, 3][i]}x</span>
                        <span className="block text-[11px] font-bold text-white tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Page 1: Wild & Free Games */}
        {page === 1 && (
          <div className="space-y-4 text-sm text-white" style={{ fontFamily: 'Georgia, serif' }}>
            <div>
              <h3 className="text-yellow-400 font-black mb-2">WILD</h3>
              <p className="text-[12px] leading-relaxed">
                BEAR is WILD and substitutes for all symbols, except SCATTER. Appears on reels 2, 3, 4 &amp; 5 and expands vertically to complete combinations.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-[5px] overflow-hidden" style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
                  <img src={SYMBOLS.brown.img} alt="Brown Bear" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-white/80 font-bold">Brown BEAR</span>
              </div>
              <p className="text-[11px] flex-1 leading-relaxed">
                Appears in main and Free Games. Cannot appear on the same reel as Raging BEAR or SCATTER.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-[5px] overflow-hidden" style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
                  <img src={SYMBOLS.spirit.img} alt="Raging Bear" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-white/80 font-bold">Raging BEAR</span>
              </div>
              <p className="text-[11px] flex-1 leading-relaxed">
                DOUBLES the win when substituting. If multiple Raging BEAR symbols are in a combination, their multipliers are multiplied together and then applied. Cannot appear on the same reel as Brown BEAR or SCATTER.
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
              <h3 className="text-yellow-400 font-black mb-2 text-center text-[13px]">
                FREE GAMES WITH WILD SYMBOL GUARANTEED TO APPEAR
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden" style={{ border: '1px solid rgba(214,178,98,0.5)' }}>
                  <img src={SYMBOLS.scatter.img} alt="Bonus" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] flex-1">
                  3 or more SCATTER symbols trigger Free Games with Wild Symbol Guaranteed to Appear.
                </p>
              </div>
              <ul className="text-[11px] space-y-0.5 pl-2">
                <li>• 3 SCATTER — 8 Free Games</li>
                <li>• 4 SCATTER — 12 Free Games</li>
                <li>• 5 SCATTER — 16 Free Games</li>
                <li>• 6 SCATTER — 24 Free Games</li>
              </ul>
              <p className="text-[10px] text-white/60 italic mt-2">
                Free Games are played with the same bet as the initial game and can be won again during the feature.
              </p>
            </div>
          </div>
        )}

        {/* Page 2: Risk Game */}
        {page === 2 && (
          <div className="space-y-3 text-[12px] text-white leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            <h3 className="text-yellow-400 font-black text-center text-base">RISK GAME (GAMBLE)</h3>
            <p>
              Take your chance to significantly increase your winnings! Choose a card from the four cards dealt on the table face down. If you beat the Dealer's card, your win is doubled, and you can try again (up to 10 attempts in total). If the Dealer wins in any round, you lose your winnings and the Risk Game ends.
            </p>
            <p className="text-white/80">
              All closed cards can be higher than the Dealer's card. All closed cards can be lower than the Dealer's card. Cards may re-appear from round to round. The probability of cards being dealt is not equally distributed.
            </p>
            <p className="text-white/80">
              The Joker beats all other cards. The Dealer can never get a Joker. Picking a card of the same value as the Dealer's means a draw: your winnings don't change, and you can take another attempt.
            </p>
            <p className="text-white/80">
              If you don't want to risk, press the TAKE WIN button to quit and collect your current winnings.
            </p>
            <p className="text-white/60 text-[10px]">
              Average RTP for the Risk Game round is 84%. Your chances vary by the Dealer's card:
            </p>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-yellow-300/80">
              <span>2 — 162%</span><span>3 — 121%</span><span>4 — 113%</span>
              <span>5 — 101%</span><span>6 — 100%</span><span>7 — 100%</span>
              <span>8 — 100%</span><span>9 — 92%</span><span>10 — 78%</span>
              <span>J — 69%</span><span>Q — 66%</span><span>K — 64%</span>
              <span>A — 42%</span>
            </div>
            {/* Card visual */}
            <div className="flex justify-center gap-2 mt-3">
              <div className="w-10 h-14 rounded-[4px] flex items-center justify-center" style={{ background: '#fff', color: '#000', fontSize: 14, fontWeight: 'bold' }}>2♠</div>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-10 h-14 rounded-[4px]" style={{ background: 'linear-gradient(135deg,#1a3a6a,#0a1a4a)', border: '1px solid rgba(214,178,98,0.4)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Page 3: Rules */}
        {page === 3 && (
          <div className="space-y-3 text-[12px] text-white leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            <h3 className="text-yellow-400 font-black">RULES</h3>
            <p>
              BIG BROWN is a 6-reel 4-row slot game with 4096 fixed pay ways.
              All prizes are for combinations of a kind. Matching symbols, except scattered symbols, should be at any position on adjacent reels, starting from the leftmost reel. Only the longest way through symbols of a kind is paid. Every symbol of a kind per reel creates a separate way. Wins on different pay ways are added.
            </p>
            <p className="text-white/80">
              All prizes in the paytable are shown for the currently selected bet. All prizes in the paytable are shown in money.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              <h3 className="text-yellow-400 font-black">WAYS</h3>
              <div className="flex gap-4 justify-center my-2">
                <div className="flex items-center gap-1">
                  <span className="text-green-400 text-lg">✓</span>
                  <div className="grid grid-cols-4 gap-0.5">
                    {[0,1,2,3].map(r => (
                      <React.Fragment key={r}>
                        <div className="w-3 h-3" style={{ background: r === 0 ? '#f5c542' : 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: r === 1 ? '#f5c542' : 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: r === 2 ? '#f5c542' : 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: 'rgba(255,255,255,0.15)' }} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-400 text-lg">✕</span>
                  <div className="grid grid-cols-4 gap-0.5">
                    {[0,1,2,3].map(r => (
                      <React.Fragment key={r}>
                        <div className="w-3 h-3" style={{ background: r === 0 ? '#f5c542' : 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: r === 2 ? '#f5c542' : 'rgba(255,255,255,0.15)' }} />
                        <div className="w-3 h-3" style={{ background: 'rgba(255,255,255,0.15)' }} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/60 text-center">Matching symbols must be on adjacent reels from the leftmost.</p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              <h3 className="text-yellow-400 font-black">ATTENTION!</h3>
              <p className="text-[11px] text-white/70">
                All unfinished games, untaken prizes, unused accumulated amounts are saved for 7 days and then canceled. Malfunction voids all pays and plays.
              </p>
            </div>
          </div>
        )}

        {/* Page 4: Bonus Pop */}
        {page === 4 && (
          <div className="space-y-4 text-[12px] text-white leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            <h3 className="text-yellow-400 font-black text-center text-base">BONUS POP BUY FEATURE</h3>
            <p>With the BONUS POP buy feature, you can play FREE GAMES WITH WILD SYMBOL GUARANTEED TO APPEAR at any time.</p>
            <p className="text-white/80">
              By clicking the BONUS POP button, you can activate a package of 8, 12, 16 or 24 Free Games. The BONUS POP cost depends directly on the total bet as well as on the chosen option cost.
            </p>
            <p className="text-white/80">
              Bonus Games activated with the BONUS POP buy feature work the same way as when triggered by chance. You can't gamble in the Risk Game the winnings received during the games activated with the BONUS POP buy feature.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              <h3 className="text-yellow-400 font-black text-center">JURISDICTIONAL INFO</h3>
              <div className="text-[11px] space-y-1 text-white/80">
                <p>THEORETICAL GAME RETURN TO PLAYER (RTP): <span className="text-yellow-300 font-bold">96.08%</span></p>
                <p>THE THEORETICAL GAME RTP DOES NOT INCLUDE THE RISK GAME (GAMBLE) RTP.</p>
                <p>THEORETICAL GAME RTP WITH BONUS POP ON: <span className="text-yellow-300">93.97% – 95.85%</span></p>
                <p>MINIMUM TOTAL BET: €0.50 (EUR)</p>
                <p>MAXIMUM TOTAL BET: €12.50 (EUR)</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pb-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-[11px] text-yellow-400 disabled:opacity-30"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="flex gap-1">
            {PAGES.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === page ? 'bg-yellow-400' : 'bg-white/20'}`} />
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(PAGES.length - 1, p + 1))}
            disabled={page === PAGES.length - 1}
            className="flex items-center gap-1 text-[11px] text-yellow-400 disabled:opacity-30"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}