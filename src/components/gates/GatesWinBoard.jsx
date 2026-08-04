import React from 'react';
import { SYM_IMG } from './GatesSymbol';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Bottom win board. For every tumble of the current spin it shows the matched
// symbol image(s) with their counts right next to that tumble's win amount, so
// the symbols and the win amount are visible together in the same banner. The
// running spin total sits at the bottom.
export default function GatesWinBoard({ history, amount }) {
  const has = history && history.length > 0;
  return (
    <div className="flex flex-col items-stretch shrink-0 rounded-[8px] px-2 py-1.5"
      style={{ minWidth: 132, maxWidth: 168,
        background: 'linear-gradient(135deg,rgba(40,20,8,0.92),rgba(18,9,4,0.92))',
        border: '1.5px solid rgba(200,140,10,0.6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
      <div className="w-full flex flex-col gap-1 overflow-y-auto"
        style={{ minHeight: 46, maxHeight: 104 }}>
        {has ? history.map((t, i) => (
          <div key={i} className="flex items-center justify-between gap-2 w-full pb-1"
            style={{ borderBottom: i < history.length - 1 ? '1px dashed rgba(200,140,10,0.22)' : 'none' }}>
            {/* Matched symbols with counts — left side */}
            <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
              {t.wins.map((w, j) => (
                <div key={j} className="flex items-center gap-0.5">
                  <img src={SYM_IMG[w.symbol]} alt={w.symbol}
                    style={{ height: 16, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#ffe080', fontWeight: 800 }}>×{w.count}</span>
                </div>
              ))}
            </div>
            {/* Win amount (and any multiplier) — right side, same line */}
            <div className="flex items-center gap-1 shrink-0">
              {t.mult > 0 && (
                <span style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#ff9040', fontWeight: 800 }}>×{t.mult}</span>
              )}
              {t.freeMode && t.bannerBefore > 0 && (
                <span style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#60a0ff', fontWeight: 800 }}>×{t.bannerBefore}</span>
              )}
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#ffd060', fontWeight: 900,
                textShadow: '0 0 5px rgba(255,200,0,0.5)' }}>
                {fmt(t.freeMode ? (t.tumbleWin || t.subtotal) : t.subtotal)}
              </span>
            </div>
          </div>
        )) : (
          <div className="flex items-center justify-center h-full">
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '12px', color: '#705028', fontWeight: 700 }}>—</span>
          </div>
        )}
      </div>
      <div className="w-full mt-1 pt-1 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(200,140,10,0.28)' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#c8a040', fontWeight: 800, letterSpacing: '0.05em' }}>WIN</span>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '13px', color: '#ffe060', fontWeight: 900,
          textShadow: '0 0 7px rgba(255,200,0,0.7)' }}>
          {fmt(amount)}
        </span>
      </div>
    </div>
  );
}