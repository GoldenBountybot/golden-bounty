import React, { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PROVIDER_LABELS = { pgsoft: 'PG SOFT', endorphina: 'Endorphina', jili: 'JILI', wg: 'WG', '*': 'All games' };

const depositLabel = (c) => {
  const from = Number(c.deposit_from) || 0;
  const to = Number(c.deposit_to) || 0;
  if (!from && !to) return 'Any deposit';
  if (to && to === from) return `Deposit #${from}`;
  if (to) return `Deposit #${from || 1}–${to}`;
  return `Deposit #${from || 1}+`;
};

const contributions = (c) =>
  Object.entries(c.game_contributions || {}).map(([k, v]) => [PROVIDER_LABELS[k] || k, `${Number(v) || 0}%`]);

function BonusDetail({ campaign, onClose }) {
  const rows = [
    ['Bonus', `${Number(campaign.percent) || 0}% of deposit`],
    ['Applies to', depositLabel(campaign)],
    ['Min deposit', `$${Number(campaign.min_deposit) || 0}`],
    ...(Number(campaign.max_deposit) ? [['Max deposit', `$${Number(campaign.max_deposit)}`]] : []),
    ['Max bonus', `$${Number(campaign.max_bonus) || 0}`],
    ['Turnover requirement', `${Number(campaign.wager_multiplier) || 0}× bonus amount`],
    ['Bonus expires in', `${Number(campaign.expiry_days) || 0} days`],
    ['Wagering deadline', `${Number(campaign.wager_deadline_days) || 0} days`],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={onClose}>
      <div className="dash-card w-full max-w-md p-4 flex flex-col gap-3 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Deposit Bonus</p>
            <p className="text-base font-black text-amber-100">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60" style={{ border: '1px solid rgba(255,255,255,0.14)' }}><X className="w-4 h-4" /></button>
        </div>

        {campaign.description && <p className="text-xs text-white/50">{campaign.description}</p>}

        <div className="flex flex-col">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 text-sm border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-white/50">{k}</span>
              <span className="text-white font-bold">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Eligible Games (turnover)</p>
          {contributions(campaign).map(([g, v]) => (
            <div key={g} className="flex justify-between text-sm">
              <span className="text-white/60">{g}</span>
              <span className="text-amber-100 font-bold">{v}</span>
            </div>
          ))}
          {(campaign.excluded_games || []).length > 0 && (
            <p className="text-[11px] text-white/40 pt-1">Not eligible: {(campaign.excluded_games || []).join(', ')}</p>
          )}
        </div>

        <p className="text-[11px] text-white/40">
          Bonus funds cannot be stacked, transferred or withdrawn until the full turnover is completed.
        </p>
      </div>
    </div>
  );
}

export default function DepositBonusChips() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.BonusCampaign.filter({ status: 'active' }, 'priority', 20)
      .then((r) => setRows(r || []))
      .catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {rows.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95"
            style={{ border: '1px solid rgba(245,197,66,0.35)', background: 'rgba(245,197,66,0.10)', color: '#f5c542' }}
          >
            <Gift className="w-3 h-3" />
            {c.name} · {Number(c.percent) || 0}%
          </button>
        ))}
      </div>
      {open && <BonusDetail campaign={open} onClose={() => setOpen(null)} />}
    </>
  );
}