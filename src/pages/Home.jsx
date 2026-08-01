import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import WesternGameBanners from '@/components/WesternGameBanners';
import LiveTicker from '@/components/LiveTicker';
import BottomNav from '@/components/BottomNav';
import SiteFooter from '@/components/SiteFooter';
import NotificationBell from '@/components/NotificationBell';
import { Wallet, FlaskConical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';

const GAMES = [
  { id: 'free-spin', titleKey: 'Daily Free Spin', category: 'Arcade', desc: 'Spin every 24h · win $1000', accent: 'from-amber-500 to-yellow-700', tag: 'FREE', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png', path: '/free-spin' },
  { id: 'wild-bounty', titleKey: 'Wild Bounty Showdown', category: 'Slots', desc: '3600 Ways · Cascade Wins', accent: 'from-amber-500 to-orange-700', tag: 'HOT', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/af2b94fcd_InShot_20260717_194156078.jpg' },
  { id: 'hi-lo', titleKey: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/162440517_generated_image.png' },
  { id: 'plinko', titleKey: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/22ada4a2e_generated_image.png' },
  { id: 'fullhouse', titleKey: 'JILI Super ACE', category: 'Cards', desc: 'Golden Wild · Free Spins', accent: 'from-amber-500 to-orange-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/199c00bd0_generated_image.png' },
  { id: 'mines', titleKey: 'Mines', category: 'Arcade', desc: 'Find the Gems · Avoid the Mines', accent: 'from-cyan-500 to-blue-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/446327a76_mines.jpg' },
  { id: 'rocket-crash', titleKey: 'Aviator', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/61f59a253_aviator-game-cover.png' },
  { id: 'crown-coins', titleKey: 'Crown Coins', category: 'Slots', desc: 'Royal Treasury · 5 Lines', accent: 'from-amber-400 to-yellow-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ef3b69c4c_generated_image.png' },
  { id: 'big-brown', titleKey: 'Big Brown', category: 'Slots', desc: '4096 Ways · Expanding Wilds', accent: 'from-amber-700 to-stone-900', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a6f715d21_generated_image.png' },
  { id: 'argonauts', titleKey: 'Argonauts', category: 'Slots', desc: '10 Lines · Free Spins · Bonus', accent: 'from-sky-500 to-indigo-800', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png' },
  { id: 'gates-of-olympus', titleKey: 'Gates of Olympus', category: 'Slots', desc: '8+ Pays · Tumbles · ×500 Mult', accent: 'from-indigo-500 to-amber-700', tag: 'HOT', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2125c8cfd_generated_image.png' },
  { id: 'thimbles', titleKey: 'Thimbles', category: 'Table', desc: 'Find the Ball · 2.88x Payout', accent: 'from-amber-600 to-stone-800', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25ec953a6_generated_image.png', path: '/games/thimbles' },
];

const CATEGORY_KEYS = ['All', 'Slots', 'Cards', 'Table', 'Arcade'];

export default function Home() {
  const { t } = useLanguage();
  const [cat, setCat] = useState('All');
  const { toast } = useToast();
  const { balance, demoMode, setDemoMode } = useCasinoBalance();
  const filtered = cat === 'All' ? GAMES : GAMES.filter(g => g.category === cat);
  const playable = GAMES.filter(g => !g.coming).length;

  return (
    <div className="min-h-screen pb-24 bg-[#0b0b0d]">
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.06)' }}
      >
        <div className="max-w-6xl mx-auto pl-4 pr-0 pt-2 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0 self-end translate-y-[13px] w-12 h-12">
              <button
                onClick={() => {
                  const next = !demoMode;
                  setDemoMode(next);
                  toast({
                    title: next ? t('Demo Mode ON · $1000 practice balance') : t('Demo Mode OFF · real balance restored'),
                    style: {
                      background: '#000000',
                      border: '1px solid rgba(214,178,98,0.7)',
                      color: '#f5c542',
                      fontFamily: 'Rye, Georgia, serif',
                      fontWeight: 700,
                      boxShadow: '0 4px 18px rgba(0,0,0,0.8), 0 0 12px rgba(214,178,98,0.3)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                    },
                  });
                }}
                title={demoMode ? 'Demo mode is ON' : 'Enable demo mode'}
                className="absolute -top-[27px] left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-all active:scale-95 z-30"
                style={{
                  border: demoMode ? '1px solid rgba(74,222,128,0.85)' : '1px solid rgba(214,178,98,0.55)',
                  background: '#000000',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${demoMode ? 'text-emerald-300' : 'text-amber-400'}`} />
                <span className="text-[10px] font-black italic tracking-wide" style={{ fontFamily: 'Rye, Georgia, serif', color: demoMode ? '#86efac' : '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>DEMO</span>
              </button>
            </div>
            <div className="flex-1 min-w-0 self-start">
              <img
                src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png"
                alt="Golden Bounty"
                className="-mt-8 translate-x-2 w-full"
                style={{ height: '104px', objectFit: 'contain' }}
              />
              <p className="text-[11px] text-amber-100/55 tracking-wide -mt-4 text-center">{playable} {t('Games Live · Play & Win')}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 self-end mr-2 -translate-y-4">
            <NotificationBell />
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] transition-colors"
              style={{ border: demoMode ? '1px solid rgba(74,222,128,0.6)' : '1px solid rgba(214,178,98,0.45)', background: demoMode ? 'rgba(34,197,94,0.12)' : 'rgba(20,17,13,0.6)' }}
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                ${balance.toFixed(2)}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Premium Western game banners */}
      <div className="max-w-6xl mx-auto px-4 mt-0">
        <WesternGameBanners />
      </div>

      {/* Live activity ticker */}
      <LiveTicker />

      {/* Category tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_KEYS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-4 py-2 rounded-[7px] text-sm font-bold italic whitespace-nowrap transition-colors"
              style={{
                fontFamily: 'Georgia, serif',
                border: cat === c
                  ? '1px solid rgba(214,178,98,0.85)'
                  : '1px solid rgba(214,178,98,0.3)',
                background: cat === c ? 'linear-gradient(to bottom,#f5c542,#c8881e)' : 'rgba(20,17,13,0.6)',
                color: cat === c ? '#2a1a06' : '#e8c878',
              }}
            >
              {t(c)}
            </button>
          ))}
        </div>
      </div>

      {/* Game grid */}
      <main id="games" className="max-w-6xl mx-auto px-4 py-6 scroll-mt-20">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map(g => (
            <CasinoGameCard key={g.id} game={{ ...g, title: t(g.titleKey) }} />
          ))}
        </div>
      </main>

      {/* Hero banner */}
      <section className="max-w-6xl mx-auto px-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fac3dbda4_file_000000008654821185c00f28c290ba18.png"
            alt="Welcome to Golden Bounty — Play 12 Premium Casino Games + Earn Daily Profit with Staking Plans"
            className="w-full h-auto block"
          />
        </div>
      </section>

      <SiteFooter />

      <BottomNav />
    </div>
  );
}