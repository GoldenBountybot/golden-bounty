import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { agentOps } from '@/lib/agentApi';

export default function AgentTransferHistory({ refreshKey = 0 }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    agentOps('history').then(r => { if (alive) setRows(r.history || []); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div className="dash-card p-4 flex flex-col gap-2">
      <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>Recent Transfers</h3>
      {rows.length === 0 && <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>No transfers yet.</p>}
      {rows.map(r => {
        const out = r.direction === 'out';
        return (
          <div key={r.id} className="flex items-center gap-3 py-2" style={{ borderTop: '1px solid rgba(212,175,55,0.14)' }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: out ? 'rgba(248,113,113,0.14)' : 'rgba(52,211,153,0.14)' }}>
              {out ? <ArrowUpRight className="w-4 h-4" style={{ color: '#f87171' }} />
                   : <ArrowDownLeft className="w-4 h-4" style={{ color: '#34d399' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: '#fff' }}>
                {out ? 'To' : 'From'} {r.counterparty}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {r.kind === 'withdraw' ? 'Withdrawal' : 'Deposit'} · {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: out ? '#f87171' : '#34d399' }}>
              {out ? '-' : '+'}${r.amount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}