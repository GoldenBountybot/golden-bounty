import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronRight } from 'lucide-react';
import { useUserBonus } from '@/lib/useUserBonus';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// Compact wallet summary of the player's active casino bonus + turnover.
// Read-only — every number comes from the existing bonus system.
export default function WalletBonusCard() {
  const navigate = useNavigate();
  const { bonus, loading } = useUserBonus();
  if (loading) return null;

  const req = Number(bonus?.required_turnover) || 0;
  const done = Math.min(Number(bonus?.completed_turnover) || 0, req);
  const pct = req > 0 ? Math.min(100, (done / req) * 100) : 0;

  return (
    <button
      onClick={() => navigate('/bonus-turnover')}
      className="dash-card w-full text-left p-4 flex flex-col gap-3 transition-all active:scale-[0.99]"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}>
          <Gift className="w-4 h-4" style={{ color: '#1a1408' }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.9)' }}>
          Casino Bonus
        </span>
      </div>

      {bonus ? (
        <>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Active Bonus</p>
            <p className="text-2xl font-extrabold tabular-nums text-white leading-tight">{money(bonus.bonus_amount)}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Turnover Progress</p>
            <p className="text-sm font-bold tabular-nums text-white">
              {money(done)} <span className="text-white/40">/ {money(req)}</span>
            </p>
          </div>

          <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FFD700,#C89B3C)', boxShadow: '0 0 12px rgba(245,197,66,0.5)' }} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold" style={{ color: '#D4AF37' }}>{pct.toFixed(0)}% Completed</span>
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#D4AF37' }}>
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-base font-extrabold text-white leading-tight">No Active Bonus</p>
            <p className="text-[12px] text-white/50 mt-0.5">Make a deposit to unlock available bonus offers.</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#D4AF37' }}>
            View Available Bonuses <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </>
      )}
    </button>
  );
}