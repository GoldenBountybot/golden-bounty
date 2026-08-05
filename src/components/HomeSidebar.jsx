import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Layers, Grid2x2, Spade, Dices, Gamepad2 } from 'lucide-react';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const CAT_ICONS = {
  All: Grid2x2,
  Slots: Spade,
  Cards: Dices,
  Table: Layers,
  Arcade: Gamepad2,
};

// Desktop-only sidebar: profile card + vertical category navigation.
// Mobile renders nothing — the horizontal tab strip is used instead.
export default function HomeSidebar({ cat, setCat, categories }) {
  const { t } = useLanguage();
  const { balance } = useCasinoBalance();
  const { user } = useAuth();
  const name = user?.full_name || user?.email?.split('@')[0] || 'Player';

  return (
    <aside
      className="hidden lg:flex flex-col gap-4 sticky top-20 self-start"
      style={{ fontFamily: SANS }}
    >
      {/* Profile card */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))',
          border: '1px solid rgba(212,175,55,0.35)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
            style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}
          >
            <span className="text-lg font-extrabold" style={{ color: '#1a1408' }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{name}</p>
            <Link to="/dashboard" className="text-[11px] font-semibold hover:underline" style={{ color: '#D4AF37' }}>
              {t('View Dashboard')}
            </Link>
          </div>
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.18)' }}>
          <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('Account')}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Wallet className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <span className="text-lg font-extrabold tabular-nums" style={{ color: '#D4AF37' }}>${balance.toFixed(2)}</span>
          </div>
          <Link
            to="/dashboard?tab=stack"
            className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', color: '#1a1408' }}
          >
            <Layers className="w-3.5 h-3.5" /> {t('Staking Plan')}
          </Link>
        </div>
      </div>

      {/* Category navigation */}
      <nav
        className="rounded-2xl p-2"
        style={{
          background: 'rgba(20,17,13,0.6)',
          border: '1px solid rgba(212,175,55,0.22)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('Categories')}</p>
        {categories.map((c) => {
          const Icon = CAT_ICONS[c] || Grid2x2;
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: active ? 'linear-gradient(135deg,rgba(255,215,0,0.18),rgba(200,155,60,0.08))' : 'transparent',
                color: active ? '#f5c542' : 'rgba(255,255,255,0.7)',
                border: active ? '1px solid rgba(212,175,55,0.5)' : '1px solid transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {t(c)}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}