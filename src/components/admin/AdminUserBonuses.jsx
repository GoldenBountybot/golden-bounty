import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const FILTERS = ['all', 'active', 'completed', 'expired'];

const statusColor = (s) => (s === 'active' ? '#f5c542' : s === 'completed' ? '#34d399' : '#a1a1aa');

export default function AdminUserBonuses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.UserBonus.list('-created_date', 500)
      .then((list) => setRows(list || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = rows.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.user_email || '').toLowerCase().includes(s) || (r.user_id || '').toLowerCase().includes(s);
  });

  if (loading) return <p className="text-white/50 text-sm">Loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="dash-input pl-9 pr-3 h-9 text-sm w-full" placeholder="Search player email or id"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="dash-input px-3 h-9 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {shown.length === 0 && <p className="text-white/45 text-sm">No bonus records.</p>}

      {shown.map((r) => {
        const req = Number(r.required_turnover) || 0;
        const done = Number(r.completed_turnover) || 0;
        const pct = req > 0 ? Math.min(100, (done / req) * 100) : 0;
        return (
          <div key={r.id} className="dash-card p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{r.user_email || r.user_id}</p>
                <p className="text-[11px] text-white/45">
                  {r.campaign_name} · <span className="capitalize">{r.deposit_source} deposit</span> ({r.deposit_method || '—'}) · {day(r.granted_at)}
                </p>
              </div>
              <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase"
                style={{ background: 'rgba(255,255,255,0.06)', color: statusColor(r.status) }}>{r.status}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[['Deposit', r.deposit_amount], ['Bonus', r.bonus_amount], ['Required', req], ['Remaining', Math.max(0, req - done)]].map(([l, v]) => (
                <div key={l} className="rounded-lg py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">{l}</p>
                  <p className="text-xs font-black tabular-nums text-amber-100">{money(v)}</p>
                </div>
              ))}
            </div>

            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f5c542,#c8881e)' }} />
            </div>
            <p className="text-[10px] text-white/45">
              Turnover {money(done)} / {money(req)} · {pct.toFixed(0)}% · deadline {day(r.wager_deadline)}
            </p>
          </div>
        );
      })}
    </div>
  );
}