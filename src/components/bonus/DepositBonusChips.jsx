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
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.BonusCampaign.filter({ status: 'active' }, 'priority', 20)
      .then((r) => setRows(r || []))
      .catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(212,175,55,0.75)' }}>
          Available Bonuses
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rows.map((c) => {
            const on = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setOpen(c); }}
                className="relative overflow-hidden text-left p-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
                style={{
                  border: on ? '1px solid rgba(245,197,66,0.85)' : '1px solid rgba(212,175,55,0.28)',
                  background: on
                    ? 'linear-gradient(135deg, rgba(245,197,66,0.20), rgba(255,255,255,0.03))'
                    : 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,255,255,0.02))',
                  boxShadow: on
                    ? '0 8px 26px rgba(0,0,0,0.5), 0 0 20px rgba(245,197,66,0.28), inset 0 1px 0 rgba(255,255,255,0.07)'
                    : '0 6px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div className="pointer-events-none absolute -top-8 -right-6 w-24 h-24 rounded-full"
                  style={{ background: `radial-gradient(circle, rgba(245,197,66,${on ? 0.22 : 0.12}), transparent 70%)` }} />

                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{
                    background: on ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'rgba(245,197,66,0.12)',
                    border: on ? 'none' : '1px solid rgba(245,197,66,0.3)',
                    boxShadow: on ? '0 0 14px rgba(212,175,55,0.5)' : 'none',
                  }}>
                  <Gift className="w-5 h-5" style={{ color: on ? '#1a1408' : '#f5c542' }} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold leading-tight truncate" style={{ color: '#fff' }}>{c.name}</p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {depositLabel(c)}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-lg font-black tabular-nums leading-none" style={{ color: '#f5c542' }}>
                    {Number(c.percent) || 0}%
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.4)' }}>bonus</span>
                </div>

                {on && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg,#FFD700,#C89B3C)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {open && <BonusDetail campaign={open} onClose={() => setOpen(null)} />}
    </>
  );
}