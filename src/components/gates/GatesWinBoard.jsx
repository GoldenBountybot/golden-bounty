import React from 'react';
import { SYM_IMG } from './GatesSymbol';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Small board shown in the bottom control row. Lists every tumble of the
// current spin: each line shows the matched symbols with their counts and
// that tumble's pay (plus any multiplier that landed). The running win total
// sits at the bottom.
export default function GatesWinBoard({ history, amount }) {
  const has = history && history.length > 0;
  return (
    <div className="flex flex-col items-stretch shrink-0 rounded-[8px] px-2 py-1"
      style={{ minWidth: 108, maxWidth: 140,
        background: 'linear-gradient(135deg,rgba(40,20,8,0.9),rgba(18,9,4,0.9))',
        border: '1.5px solid rgba(200,140,10,0.55)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
      <div className="w-full flex flex-col gap-1 overflow-y-auto"
        style={{ minHeight: 42, maxHeight: 96 }}>
        {has ? history.map((t, i) => (
          <div key={i} className="flex flex-col gap-0.5 w-full pb-1"
            style={{ borderBottom: i < history.length - 1 ? '1px dashed rgba(200,140,10,0.2)' : 'none' }}>
            <div className="flex items-center gap-1 flex-wrap">
              {t.wins.map((w, j) => (
                <div key={j} className="flex items-center gap-0.5">
                  <img src={SYM_IMG[w.symbol]} alt={w.symbol}
                    style={{ height: 13, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', color: '#ffe080', fontWeight: 700 }}>×{w.count}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between w-full">
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', color: '#b09060', fontWeight: 700 }}>
                {t.mult > 0 ? `×${t.mult}` : ''}
              </span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '9px', color: '#ffd060', fontWeight: 900 }}>
                {fmt(t.subtotal)}
              </span>
            </div>
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