import React, { useMemo, memo } from 'react';

function colorFor(m) {
  if (m < 2) return 'text-indigo-300';
  if (m < 10) return 'text-fuchsia-300';
  return 'text-rose-300';
}

function LiveBets({ bets }) {
  // Player's own bets always render at the top; the rest follow in descending
  // bet-amount order ($500 → $0.10).
  const sorted = useMemo(() => {
    const player = bets.filter((b) => b.isPlayer).sort((a, b) => b.amount - a.amount);
    const rest = bets.filter((b) => !b.isPlayer).sort((a, b) => b.amount - a.amount);
    return [...player, ...rest];
  }, [bets]);
  const totalAmount = useMemo(() => bets.reduce((s, b) => s + b.amount, 0), [bets]);

  return (
    <div className="flex flex-col h-full rounded-xl bg-black/40 border border-indigo-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black/50 border-b border-indigo-900/40">
        <span className="text-[11px] font-bold tracking-widest text-indigo-200/80 uppercase">
          {bets.length} Bets
        </span>
        <span className="text-[11px] font-bold text-indigo-200/80 tabular-nums">
          Total: ${totalAmount.toFixed(2)}
        </span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        {sorted.map(b => (
          <div key={b.id} className="grid grid-cols-3 gap-1 px-3 py-1.5 text-xs border-b border-white/5">
            <span className={`truncate ${b.isPlayer ? 'text-indigo-200 font-bold' : 'text-indigo-100/80'}`}>{b.name}</span>
            <span className="text-right tabular-nums text-indigo-100/70">${b.amount.toFixed(2)}</span>
            {b.cashedOut ? (
              <span className={`text-right font-bold tabular-nums ${colorFor(b.cashOutAt)}`}>
                {b.cashOutAt.toFixed(2)}x
              </span>
            ) : (
              <span className="text-right text-indigo-100/30">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(LiveBets);