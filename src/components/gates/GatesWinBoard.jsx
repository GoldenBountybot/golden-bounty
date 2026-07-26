import React from 'react';
import { SYM_IMG } from './GatesSymbol';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Small board shown in the bottom control row. Lists each winning symbol with
// its match count and pay for the current tumble, plus the running win amount.
export default function GatesWinBoard({ wins, amount }) {
  const hasWins = wins && wins.length > 0;
  return (
    <div className="flex flex-col items-center shrink-0 rounded-[8px] px-2 py-1"
      style={{ minWidth: 96,
        background: 'linear-gradient(135deg,rgba(40,20,8,0.9),rgba(18,9,4,0.9))',
        border: '1.5px solid rgba(200,140,10,0.55)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
      <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', fontWeight: 700, color: '#c8a040', letterSpacing: '0.1em' }}>
        WIN BOARD
      </span>
      <div className="w-full flex flex-col gap-0.5 mt-1" style={{ minHeight: 42 }}>
        {hasWins ? wins.map((w, i) => (
          <div key={i} className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1 min-w-0">
              <img src={SYM_IMG[w.symbol]} alt={w.symbol}
                style={{ height: 16, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', color: '#ffe080', fontWeight: 700 }}>×{w.count}</span>
            </div>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', color: '#ffd060', fontWeight: 900, flexShrink: 0 }}>
              {fmt(w.pay)}
            </span>
          </div>
        )) : (
          <div className="flex items-center justify-center h-full">
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '10px', color: '#705028', fontWeight: 700 }}>—</span>
          </div>
        )}
      </div>
      <div className="w-full mt-1 pt-1 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(200,140,10,0.25)' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', color: '#c8a040', fontWeight: 700 }}>WIN</span>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#ffe060', fontWeight: 900,
          textShadow: '0 0 6px rgba(255,200,0,0.6)' }}>
          {fmt(amount)}
        </span>
      </div>
    </div>
  );
}