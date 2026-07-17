import React from 'react';

function colorFor(m) {
  if (m < 2) return 'bg-indigo-500/80 text-indigo-50';
  if (m < 10) return 'bg-fuchsia-500/80 text-fuchsia-50';
  return 'bg-rose-500/85 text-rose-50';
}

export default function HistoryBar({ history }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {history.map((m, i) => (
        <span key={i} className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-black italic tabular-nums ${colorFor(m)}`}
          style={{ fontFamily: 'Georgia, serif' }}>
          {m.toFixed(2)}x
        </span>
      ))}
    </div>
  );
}