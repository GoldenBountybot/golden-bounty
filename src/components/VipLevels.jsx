import React from 'react';
import { Crown } from 'lucide-react';
import { VIP_LEVELS, getVipLevel, getNextVipLevel, BASE_RATE } from '@/lib/vipLevels';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

// VIP tiers (Bronze → Diamond) display with current level, progress to next,
// and the Stack profit rate each tier unlocks.
export default function VipLevels({ totalDeposits }) {
  const current = getVipLevel(totalDeposits);
  const next = getNextVipLevel(totalDeposits);
  const rate = current?.rate ?? BASE_RATE;
  const progress = next ? Math.min(100, (totalDeposits / next.minDeposit) * 100) : 100;
  const remaining = next ? Math.max(0, next.minDeposit - totalDeposits) : 0;

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS }}>
      {/* Current VIP status — premium glass card with golden glow */}
      <div
        className="dash-card relative overflow-hidden p-5 flex flex-col gap-3"
        style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 28px rgba(212,175,55,0.18), 0 10px 30px rgba(0,0,0,0.5)' }}
      >
        <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden" style={{ background: '#000', border: '1px solid ' + (current?.color || 'rgba(212,175,55,0.35)') }}>
              {current ? <img src={current.logo} alt={current.name} className="w-full h-full object-cover" /> : <Crown className="w-5 h-5" style={{ color: '#8a7a5a' }} />}
            </div>
            <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>
              {current ? `VIP Level ${current.level} · ${current.name}` : 'No VIP Yet'}
            </h2>
          </div>
          {current && (
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: current.color, color: '#1a1408' }}>
              {current.name}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5 mt-1">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Total Deposits: <span className="font-bold" style={{ color: '#fff' }}>${totalDeposits.toFixed(2)}</span>
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Your Stack Profit Rate: <span className="font-bold" style={{ color: '#34d399' }}>{(rate * 100).toFixed(2)}% / day</span>
          </p>
        </div>

        {next ? (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: progress + '%', background: 'linear-gradient(90deg, #FFD700, #C89B3C)', boxShadow: '0 0 10px rgba(212,175,55,0.6)' }}
              />
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Deposit ${remaining.toFixed(2)} more to reach {next.name}</p>
          </div>
        ) : (
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Highest VIP level reached!</p>
        )}
      </div>

      {/* Tier ladder: Regular (No level) → Diamond */}
      <div
        className="dash-card p-4 flex items-center gap-4"
        style={{ animation: 'dashFadeIn 400ms ease both', border: '1px solid rgba(212,175,55,0.25)' }}
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Crown className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ color: '#fff' }}>No Level · Regular</h3>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Any deposit amount</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.7)' }}>Rate</p>
          <p className="text-base font-extrabold tabular-nums leading-tight" style={{ color: (!current) ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
            {(BASE_RATE * 100).toFixed(2)}%
          </p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>/ day</p>
        </div>
      </div>

      {VIP_LEVELS.map((lv, i) => {
        const reached = totalDeposits >= lv.minDeposit;
        const isCurrent = current?.level === lv.level;
        const borderStyle = isCurrent ? ('1px solid ' + lv.color) : '1px solid rgba(212,175,55,0.25)';
        return (
          <div
            key={lv.level}
            className="dash-card p-4 flex items-center gap-4"
            style={{ animation: 'dashFadeIn 400ms ease both', animationDelay: (60 * i) + 'ms', border: borderStyle, boxShadow: isCurrent ? ('0 0 22px ' + lv.color + '40, 0 8px 24px rgba(0,0,0,0.5)') : undefined }}
          >
            {/* Left — VIP icon in glowing circle */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 18px ' + (lv.color || '#8a7a5a') + '80', transform: 'scale(0.9)' }} />
              <div className="w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden" style={{ background: '#000', border: '1px solid ' + (lv.color || '#8a7a5a') }}>
                <img src={lv.logo} alt={lv.name} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Center — title + deposit requirement */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold" style={{ color: '#fff' }}>
                VIP {lv.level} · {lv.name}
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Deposit ${lv.minDeposit.toLocaleString()}+</p>
            </div>

            {/* Right — profit rate */}
            <div className="text-right shrink-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.7)' }}>Rate</p>
              <p className="text-base font-extrabold tabular-nums leading-tight" style={{ color: reached ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
                {(lv.rate * 100).toFixed(2)}%
              </p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>/ day</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}