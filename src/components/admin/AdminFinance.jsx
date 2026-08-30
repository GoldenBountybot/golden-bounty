import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { base44 } from '@/api/base44Client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DONE = ['approved', 'completed'];

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminFinance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const txs = await base44.entities.Transaction.list('-created_date', 5000).catch(() => []);
      if (!active) return;
      const map = new Map();
      txs.forEach((t) => {
        if (!DONE.includes(t.status)) return;
        if (t.type !== 'deposit' && t.type !== 'withdraw') return;
        const d = new Date(t.created_date);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const row = map.get(key) || { key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, deposit: 0, withdraw: 0, depCount: 0, wdCount: 0 };
        if (t.type === 'deposit') { row.deposit += Number(t.amount) || 0; row.depCount++; }
        else { row.withdraw += Number(t.amount) || 0; row.wdCount++; }
        map.set(key, row);
      });
      const list = [...map.values()]
        .map((r) => ({ ...r, profit: r.deposit - r.withdraw }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
      setRows(list);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const totalDep = rows.reduce((s, r) => s + r.deposit, 0);
  const totalWd = rows.reduce((s, r) => s + r.withdraw, 0);
  const totalProfit = totalDep - totalWd;

  const chartData = [...rows].reverse().slice(-12).map((r) => ({
    name: r.label.replace(' ', "'").slice(0, 7),
    Deposit: Number(r.deposit.toFixed(2)),
    Withdraw: Number(r.withdraw.toFixed(2)),
    Profit: Number(r.profit.toFixed(2)),
  }));

  const card = {
    background: 'linear-gradient(135deg, rgba(214,178,98,0.10), rgba(255,255,255,0.03))',
    border: '1px solid rgba(214,178,98,0.28)',
    borderRadius: 16,
    boxShadow: '0 8px 26px rgba(0,0,0,0.45)',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-amber-300 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading finance report…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Deposits', value: totalDep, icon: ArrowDownToLine, color: '#34d399' },
          { label: 'Total Withdrawals', value: totalWd, icon: ArrowUpFromLine, color: '#f87171' },
          { label: 'Net Profit', value: totalProfit, icon: totalProfit >= 0 ? TrendingUp : TrendingDown, color: totalProfit >= 0 ? '#FFD700' : '#f87171' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4" style={card}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(232,200,120,0.85)' }}>{s.label}</p>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{money(s.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="p-3 pt-4" style={card}>
          <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(232,200,120,0.85)' }}>Monthly Overview</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(214,178,98,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'rgba(232,200,120,0.7)', fontSize: 10 }} stroke="rgba(214,178,98,0.25)" />
                <YAxis tick={{ fill: 'rgba(232,200,120,0.7)', fontSize: 10 }} stroke="rgba(214,178,98,0.25)" />
                <Tooltip
                  contentStyle={{ background: 'rgba(14,12,9,0.95)', border: '1px solid rgba(214,178,98,0.4)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#e8c878' }}
                  formatter={(v) => money(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#e8c878' }} />
                <Bar dataKey="Deposit" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Withdraw" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#f5c542" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="flex flex-col gap-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(232,200,120,0.85)' }}>Month by Month</p>
        {rows.length === 0 ? (
          <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>No completed transactions yet.</p>
        ) : rows.map((r) => (
          <div key={r.key} className="p-4" style={card}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold" style={{ color: '#e8c878', fontFamily: 'Georgia, serif' }}>{r.label}</p>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tabular-nums" style={{ color: r.profit >= 0 ? '#FFD700' : '#f87171', background: 'rgba(255,255,255,0.04)', border: `1px solid ${r.profit >= 0 ? 'rgba(255,215,0,0.35)' : 'rgba(248,113,113,0.35)'}` }}>
                Profit {money(r.profit)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Deposits ({r.depCount})</p>
                <p className="text-base font-bold tabular-nums" style={{ color: '#34d399' }}>{money(r.deposit)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Withdrawals ({r.wdCount})</p>
                <p className="text-base font-bold tabular-nums" style={{ color: '#f87171' }}>{money(r.withdraw)}</p>
              </div>
            </div>
            {/* proportion bar */}
            <div className="mt-3 h-1.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${(r.deposit / Math.max(r.deposit + r.withdraw, 0.01)) * 100}%`, background: '#34d399' }} />
              <div style={{ flex: 1, background: '#f87171' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}