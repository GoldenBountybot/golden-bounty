import React from 'react';
import { Target } from 'lucide-react';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// Visual turnover progress for an active bonus.
export default function TurnoverProgressCard({ required, completed }) {
  const req = Number(required) || 0;
  const done = Math.min(Number(completed) || 0, req);
  const remaining = Math.max(0, req - done);
  const pct = req > 0 ? Math.min(100, (done / req) * 100) : 0;

  return (
    <div className="dash-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-amber-300" />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Turnover Progress</span>
      </div>

      <p className="text-lg font-black tabular-nums text-white">
        {money(done)} <span className="text-white/40">/ {money(req)}</span>
        <span className="ml-2 text-sm text-amber-300">{pct.toFixed(0)}%</span>
      </p>

      <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f5c542,#c8881e)', boxShadow: '0 0 12px rgba(245,197,66,0.5)' }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Required', req], ['Completed', done], ['Remaining', remaining]].map(([label, val]) => (
          <div key={label} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] uppercase tracking-widest text-white/45">{label}</p>
            <p className="text-sm font-black tabular-nums text-amber-100">{money(val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}