import React from 'react';
import { Coins, Trophy, TrendingDown, Gamepad2 } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const CELLS = [
  { key: 'bet',   label: 'Total Bet',  Icon: Coins,        color: '#D4AF37', bg: 'rgba(212,175,55,0.14)', border: 'rgba(212,175,55,0.4)' },
  { key: 'win',   label: 'Total Win',  Icon: Trophy,       color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' },
  { key: 'loss',  label: 'Total Loss', Icon: TrendingDown, color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)' },
  { key: 'rounds',label: 'Rounds',     Icon: Gamepad2,     color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)' },
];

// Bet performance summary for the selected period — total wagered, won, lost,
// rounds played and the resulting net profit / loss.
export default function BetStatsPanel({ stats }) {
  const { t } = useLanguage();
  const net = stats.win - stats.loss;

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CELLS.map(({ key, label, Icon, color, bg, border }) => (
          <div key={key} className="dash-card p-4 flex items-center gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(label)}</p>
              <AnimatedNumber
                value={stats[key]}
                prefix={key === 'rounds' ? '' : '$'}
                decimals={key === 'rounds' ? 0 : 2}
                className="text-lg font-extrabold tabular-nums"
                style={{ color, fontFamily: SANS }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card p-4 flex items-center justify-between" style={{ animation: 'dashFadeIn 400ms ease both' }}>
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('Net Profit / Loss')}</span>
        <span className="text-xl font-extrabold tabular-nums" style={{ color: net >= 0 ? '#34d399' : '#f87171' }}>
          {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
        </span>
      </div>
    </div>
  );
}