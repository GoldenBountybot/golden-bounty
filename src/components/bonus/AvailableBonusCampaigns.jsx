import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PROVIDER_LABELS = { pgsoft: 'PG SOFT', endorphina: 'Endorphina', jili: 'JILI', wg: 'WG', '*': 'All games' };

const depositLabel = (c) => {
  const from = Number(c.deposit_from) || 0;
  const to = Number(c.deposit_to) || 0;
  if (!from && !to) return 'Any deposit';
  if (to && to === from) return `Deposit #${from}`;
  if (to) return `Deposit #${from || 1}–${to}`;
  return `Deposit #${from || 1} onward`;
};

const gamesLabel = (c) =>
  Object.entries(c.game_contributions || {})
    .filter(([, v]) => (Number(v) || 0) > 0)
    .map(([k]) => PROVIDER_LABELS[k] || k)
    .join(' · ') || '—';

export default function AvailableBonusCampaigns() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    base44.entities.BonusCampaign.filter({ status: 'active' }, 'priority', 20)
      .then((r) => setRows(r || []))
      .catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
    <div className="dash-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Available Bonuses</span>
      </div>

      {rows.map((c) => (
        <div key={c.id} className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(214,178,98,0.18)' }}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-amber-100">{c.name}</p>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: 'rgba(245,197,66,0.16)', color: '#f5c542' }}>
              {Number(c.percent) || 0}%
            </span>
          </div>
          <p className="text-[11px] text-white/55">
            {depositLabel(c)} · min ${Number(c.min_deposit) || 0} · {Number(c.wager_multiplier) || 0}× turnover
          </p>
          <p className="text-[11px] text-white/45">Eligible games: <span className="text-amber-100/90 font-bold">{gamesLabel(c)}</span></p>
          {c.description && <p className="text-[11px] text-white/40">{c.description}</p>}
        </div>
      ))}
    </div>
  );
}