import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const depositLabel = (c) => {
  const from = Number(c.deposit_from) || 0;
  const to = Number(c.deposit_to) || 0;
  if (!from && !to) return 'Any deposit';
  if (to && to === from) return `Deposit #${from}`;
  if (to) return `Deposit #${from || 1}–${to}`;
  return `Deposit #${from || 1}+`;
};

export default function DepositBonusChips() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.BonusCampaign.filter({ status: 'active' }, 'priority', 20)
      .then((r) => setRows(r || []))
      .catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
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
              onClick={() => { setSelected(c.id); navigate(`/bonus-offer/${c.id}`); }}
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
  );
}