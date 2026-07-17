import React from 'react';
import { Gem } from 'lucide-react';
import { LOCK_DAYS, DAILY_RATE } from '@/lib/useStake';

// Animated USDT mining scene for the Stack tab: coins get mined out of the
// vein and float up, a pickaxe swings, and a profit curve rises with the lock
// progress. Purely decorative — the real numbers come from useStake.
export default function StackMining({ staked, pendingProfit, daysLocked, unlocked }) {
  const progress = Math.min(daysLocked / LOCK_DAYS, 1);
  const totalPct = DAILY_RATE * 100 * LOCK_DAYS; // 45% over the lock
  const curPct = DAILY_RATE * 100 * daysLocked;

  // profit curve points (cumulative % per day)
  const W = 100, H = 100, SEG = 16;
  const pts = [];
  for (let i = 0; i <= SEG; i++) {
    const x = (i / SEG) * W;
    const d = (i / SEG) * LOCK_DAYS;
    const pct = DAILY_RATE * 100 * d;
    const y = H - (pct / totalPct) * (H * 0.86) - 6;
    pts.push([x, y]);
  }
  const vis = Math.max(1, Math.round(progress * SEG));
  const line = pts.slice(0, vis + 1).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${(pts[vis][0]).toFixed(1)} 100 L 0 100 Z`;
  const tip = pts[vis];

  // floating coins mined from the vein
  const coins = Array.from({ length: 7 }, (_, i) => ({
    left: 12 + i * 11,
    delay: (i * 0.55) % 4,
    dur: 2.6 + (i % 3) * 0.4,
    size: 16 + (i % 3) * 4,
  }));

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-emerald-700/40"
      style={{ aspectRatio: '16 / 9', background: 'radial-gradient(circle at 50% 110%, rgba(38,161,123,0.35), rgba(2,6,8,0.95) 70%)', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7)' }}>

      {/* faint grid */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[25, 50, 75].map(g => (
          <line key={'h' + g} x1="0" y1={g} x2="100" y2={g} stroke="rgba(38,161,123,0.10)" strokeWidth="0.3" />
        ))}
      </svg>

      {/* profit curve */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(38,161,123,0.55)" />
            <stop offset="100%" stopColor="rgba(38,161,123,0)" />
          </linearGradient>
          <linearGradient id="mineLine" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#26a17b" />
            <stop offset="100%" stopColor="#7af0c8" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mineFill)" />
        <path d={line} fill="none" stroke="url(#mineLine)" strokeWidth="1.2" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 3px rgba(122,240,200,0.7))' }} />
      </svg>

      {/* glowing vein at the bottom */}
      <div className="absolute bottom-0 inset-x-0 h-10"
        style={{ background: 'linear-gradient(to top, rgba(38,161,123,0.5), transparent)', animation: 'mineGlowPulse 2.4s ease-in-out infinite' }} />

      {/* floating mined USDT coins */}
      {coins.map((c, i) => (
        <span key={i} className="absolute bottom-2 z-20"
          style={{ left: `${c.left}%`, width: c.size, height: c.size, animation: `usdtFloat ${c.dur}s ease-in ${c.delay}s infinite` }}>
          <span className="flex items-center justify-center w-full h-full rounded-full border-2 border-emerald-200/80 text-emerald-50 font-black"
            style={{ background: 'radial-gradient(circle at 35% 30%, #4dd6a8, #1e8a63)', fontSize: c.size * 0.5, boxShadow: '0 0 8px rgba(38,161,123,0.8)' }}>
            ₮
          </span>
        </span>
      ))}

      {/* swinging pickaxe mining the vein */}
      <span className="absolute z-10" style={{ left: '50%', bottom: '14px', transformOrigin: 'bottom center', animation: 'pickSwing 1.6s ease-in-out infinite' }}>
        <Gem className="w-7 h-7 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px rgba(255,200,80,0.8))' }} />
      </span>

      {/* header label */}
      <div className="absolute top-2 left-3 z-30 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-emerald-200/80 text-emerald-50 font-black text-[10px]"
          style={{ background: 'radial-gradient(circle at 35% 30%, #4dd6a8, #1e8a63)' }}>₮</span>
        <span className="text-[11px] font-black tracking-widest text-emerald-200/90 uppercase" style={{ fontFamily: 'Georgia, serif' }}>USDT Mining</span>
      </div>

      {/* live numbers */}
      <div className="absolute top-2 right-3 z-30 text-right">
        <p className="text-[9px] tracking-widest uppercase text-emerald-300/70">Profit Rate</p>
        <p className="text-xs font-black italic text-emerald-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>+{(DAILY_RATE * 100)}% / day</p>
      </div>

      <div className="absolute bottom-2 right-3 z-30 text-right">
        <p className="text-[9px] tracking-widest uppercase text-emerald-300/70">Mined Profit</p>
        <p className="text-sm font-black italic text-emerald-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
          {curPct.toFixed(0)}% · ${pendingProfit.toFixed(2)}
        </p>
      </div>

      <div className="absolute bottom-2 left-3 z-30">
        <p className="text-[9px] tracking-widest uppercase text-emerald-300/70">Staked</p>
        <p className="text-sm font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${staked.toFixed(2)}</p>
      </div>
    </div>
  );
}