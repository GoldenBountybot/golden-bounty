import React from 'react';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Crown } from 'lucide-react';
import { VIP_LEVELS, getVipLevel, getNextVipLevel, BASE_RATE } from '@/lib/vipLevels';

// VIP tiers (Bronze → Diamond) display with current level, progress to next,
// and the Stack profit rate each tier unlocks.
export default function VipLevels({ totalDeposits }) {
  const current = getVipLevel(totalDeposits);
  const next = getNextVipLevel(totalDeposits);
  const rate = current?.rate ?? BASE_RATE;
  const progress = next ? Math.min(100, (totalDeposits / next.minDeposit) * 100) : 100;
  const remaining = next ? Math.max(0, next.minDeposit - totalDeposits) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Current VIP status */}
      <WesternFrame glow variant="glass" className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" style={{ color: current?.color || '#8a7a5a' }} />
            <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
              {current ? `VIP Level ${current.level} · ${current.name}` : 'No VIP Yet'}
            </h2>
          </div>
          {current && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black italic" style={{ background: current.color, color: '#2a1a06' }}>
              {current.name}
            </span>
          )}
        </div>
        <p className="text-xs text-amber-100/60 italic">
          Total Deposits: <span className="font-bold text-yellow-100">${totalDeposits.toFixed(2)}</span>
        </p>
        <p className="text-xs text-amber-100/80 italic">
          Your Stack Profit Rate: <span className="font-bold text-emerald-300">{(rate * 100).toFixed(2)}% / day</span>
        </p>
        {next ? (
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-2 rounded-full bg-black/50 overflow-hidden border border-amber-700/30">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${current?.color || '#8a7a5a'}, ${next.color})` }} />
            </div>
            <p className="text-[10px] text-amber-100/50 italic">Deposit ${remaining.toFixed(2)} more to reach {next.name}</p>
          </div>
        ) : (
          <p className="text-[10px] text-amber-100/50 italic">Highest VIP level reached!</p>
        )}
      </WesternFrame>

      {/* Tier ladder: Bronze → Diamond */}
      {VIP_LEVELS.map(lv => {
        const reached = totalDeposits >= lv.minDeposit;
        const isCurrent = current?.level === lv.level;
        return (
          <WesternFrame
            key={lv.level}
            variant="glass"
            className={`p-3 flex items-center gap-3 ${isCurrent ? 'ring-2' : ''}`}
            style={isCurrent ? { boxShadow: `inset 0 0 0 2px ${lv.color}, 0 2px 6px rgba(0,0,0,0.5)` } : {}}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ background: lv.color, boxShadow: '0 0 0 2px rgba(255,255,255,0.15), 0 1px 4px rgba(0,0,0,0.4)' }}>
              <span className="text-lg font-black" style={{ fontFamily: 'Georgia, serif', color: '#2a1a06' }}>{lv.level}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
                VIP {lv.level} · {lv.name}
              </h3>
              <p className="text-[11px] text-amber-100/60 italic">Deposit ${lv.minDeposit.toLocaleString()}+</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-widest uppercase text-amber-300/70">Rate</p>
              <p className="text-sm font-black italic tabular-nums" style={{ color: reached ? '#7af0c8' : '#8a7a5a', fontFamily: 'Georgia, serif' }}>
                {(lv.rate * 100).toFixed(2)}%
              </p>
              <p className="text-[9px] text-amber-100/40 italic">/ day</p>
            </div>
          </WesternFrame>
        );
      })}
    </div>
  );
}