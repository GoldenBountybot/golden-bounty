import React from 'react';
import { SYMBOLS, PAYTABLE, FREE_SPINS_AWARD, SCATTER_PAY } from './argonautsEngine';

// Argonauts paytable screen — matches the reference: black background, gold
// headings, two-column symbol rows with currency payouts for 5/4/3 matches,
// a WILD info block, and a yellow footer banner. Payouts scale with the
// current line bet (bet / 10), so at the €0.10 reference bet they read
// exactly like the screenshot.

const ORDER = ['wild', 'jason', 'atlanta', 'lizard', 'dove', 'cup', 'harp', 'potion', 'bow'];

function Tile({ sym, size = 44 }) {
  return (
    <div
      className="shrink-0 rounded-[5px] overflow-hidden"
      style={{ width: size, height: size, border: '1px solid rgba(255,215,0,0.45)', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)' }}
    >
      <img src={sym.image} alt={sym.name} className="w-full h-full object-cover" draggable={false} />
    </div>
  );
}

export default function ArgoPaytable({ bet, onClose }) {
  const lineBet = bet / 10;
  const eur = (mult) => `€${(mult * lineBet).toFixed(2)}`;

  return (
    <div className="w-full">
      <h2
        className="text-center text-xl font-black mb-1 tracking-[0.2em]"
        style={{ fontFamily: 'Georgia, serif', color: '#FFD700', textShadow: '0 1px 2px #000' }}
      >
        ARGONAUTS
      </h2>
      <div className="mx-auto mb-3 h-[2px] w-2/3" style={{ background: 'linear-gradient(to right, transparent, #FFD700, transparent)' }} />
      <p className="text-center text-[11px] font-black tracking-widest mb-2" style={{ fontFamily: 'Georgia, serif', color: '#FFD700' }}>PAYTABLE</p>

      <div className="grid grid-cols-2 gap-1.5 max-h-[52vh] overflow-y-auto pr-1">
        {ORDER.map((id) => {
          const s = SYMBOLS[id];
          const pt = PAYTABLE[id];
          return (
            <div key={id} className="flex items-center gap-2 p-1.5 rounded-[6px]" style={{ border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(0,0,0,0.5)' }}>
              <Tile sym={s} />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-amber-200/80 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{s.name.toUpperCase()}</p>
                <p className="text-[10px] tabular-nums text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  <span className="text-yellow-300">5×</span> {eur(pt[2])}<br />
                  <span className="text-yellow-300">4×</span> {eur(pt[1])}<br />
                  <span className="text-yellow-300">3×</span> {eur(pt[0])}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCATTER */}
      <div className="mt-2 p-2 rounded-[6px] flex items-center gap-2" style={{ border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(0,0,0,0.5)' }}>
        <Tile sym={SYMBOLS.scatter} />
        <div>
          <p className="text-[9px] font-bold text-amber-200/80" style={{ fontFamily: 'Georgia, serif' }}>SCATTER</p>
          <p className="text-[10px] tabular-nums text-white" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-yellow-300">3×</span> €{(SCATTER_PAY * bet).toFixed(2)} → {FREE_SPINS_AWARD} FREE GAMES
          </p>
        </div>
      </div>

      {/* WILD info */}
      <div className="mt-3 flex gap-2.5 p-2 rounded-[6px]" style={{ border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(0,0,0,0.5)' }}>
        <Tile sym={SYMBOLS.wild} size={56} />
        <div>
          <p className="text-[12px] font-black text-yellow-300" style={{ fontFamily: 'Georgia, serif' }}>WILD</p>
          <p className="text-[9.5px] text-white/85 leading-snug mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
            Substitutes for all symbols, except SCATTER and BONUS. Appears stacked both in the main game and Free Games.
          </p>
        </div>
      </div>

      {/* Footer banner */}
      <div className="mt-3 text-center py-1.5 rounded-[6px]" style={{ background: 'linear-gradient(to bottom, #FFE9A8, #F5C542 55%, #C8881E)' }}>
        <p className="text-[10px] font-black tracking-wide" style={{ fontFamily: 'Georgia, serif', color: '#3a2408', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
          FREE GAMES WITH THE HIGHEST PAYING SYMBOLS
        </p>
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full py-2 rounded-[8px] font-black tracking-wider"
        style={{ border: '1px solid rgba(255,215,0,0.5)', background: 'rgba(0,0,0,0.6)', color: '#FFD700', fontFamily: 'Georgia, serif' }}
      >
        CLOSE
      </button>
    </div>
  );
}