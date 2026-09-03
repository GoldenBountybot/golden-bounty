import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import WesternGameBanners from '@/components/WesternGameBanners';
import LiveTicker from '@/components/LiveTicker';
import BottomNav from '@/components/BottomNav';
import DesktopSidebar from '@/components/DesktopSidebar';
import SiteFooter from '@/components/SiteFooter';
import NotificationBell from '@/components/NotificationBell';
import HomeSidebar from '@/components/HomeSidebar';
import FadeImage from '@/components/FadeImage';
import { Wallet, FlaskConical, Gift } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import { isInsideTelegram } from '@/lib/telegram';
import { PG_GAMES } from '@/lib/pgGames';
import { JILI_GAMES } from '@/lib/jiliGames';
import { ENDORPHINA_GAMES, ENDORPHINA_LIVE } from '@/lib/endorphinaGames';

const GAMES = [
  { id: 'free-spin', titleKey: 'Daily Free Spin', category: 'Arcade', desc: 'Spin every 24h · win $1000', accent: 'from-amber-500 to-yellow-700', tag: 'FREE', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png', path: '/free-spin' },
  { id: 'hi-lo', titleKey: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/162440517_generated_image.png' },
  { id: 'plinko', titleKey: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/22ada4a2e_generated_image.png' },
  { id: 'fullhouse', titleKey: 'JILI Super ACE', category: 'Cards', desc: 'Golden Wild · Free Spins', accent: 'from-amber-500 to-orange-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/199c00bd0_generated_image.png' },
  { id: 'mines', titleKey: 'Mines', category: 'Arcade', desc: 'Find the Gems · Avoid the Mines', accent: 'from-cyan-500 to-blue-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/446327a76_mines.jpg' },
  { id: 'rocket-crash', titleKey: 'Aviator', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/61f59a253_aviator-game-cover.png' },
  { id: 'crown-coins', titleKey: 'Crown Coins', category: 'Slots', desc: 'Royal Treasury · 5 Lines', accent: 'from-amber-400 to-yellow-700', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/ef3b69c4c_generated_image.png' },
  { id: 'big-brown', titleKey: 'Big Brown', category: 'Slots', desc: '4096 Ways · Expanding Wilds', accent: 'from-amber-700 to-stone-900', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/a6f715d21_generated_image.png' },
  { id: 'argonauts', titleKey: 'Argonauts', category: 'Slots', desc: '10 Lines · Free Spins · Bonus', accent: 'from-sky-500 to-indigo-800', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/766629235_generated_image.png' },
  { id: 'thimbles', titleKey: 'Thimbles', category: 'Table', desc: 'Find the Ball · 2.88x Payout', accent: 'from-amber-600 to-stone-800', tag: 'NEW', image: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/25ec953a6_generated_image.png', path: '/games/thimbles' },
];

// PG SOFT titles are folded straight into the main lobby under their own
// category — no separate PG lobby page.
// PG_GAMES is already sorted popular-first, so the leading slice fills the
// Popular tab; the rest fall into Table / Slots.
const PG_POPULAR_COUNT = 30;
const PG_LOBBY_GAMES = PG_GAMES.map((g, i) => ({
  id: `pg-${g.id}`,
  titleKey: g.title,
  category: i < PG_POPULAR_COUNT ? 'Popular' : g.cats.includes('Table') ? 'Table' : 'Slots',
  desc: g.desc,
  accent: g.accent,
  tag: '',
  provider: 'PG SOFT',
  image: g.image,
  path: `/games/pg/${g.id}`,
}));

// JILI titles are folded into the same lobby, mapped onto our categories.
// JILI provider category id → our lobby category. Any id we don't know yet
// (a brand-new JILI category) lands in "Other" so it still shows up.
const JILI_CAT_MAP = { 2: 'Popular', 3: 'Slots', 4: 'Fishing', 5: 'Cards', 6: 'Bingo', 8: 'Arcade' };
const JILI_LOBBY_GAMES = JILI_GAMES.map(g => ({
  id: `jili-${g.id}`,
  titleKey: g.name,
  category: JILI_CAT_MAP[g.cat] || 'Other',
  desc: 'JILI Games',
  accent: 'from-amber-500 to-orange-700',
  tag: '',
  provider: 'JILI',
  image: g.cover,
  path: `/games/jili/${g.id}`,
}));

// Endorphina titles — Dice variants sit under Table, everything else is Slots.
const ENDO_LOBBY_GAMES = (ENDORPHINA_LIVE ? ENDORPHINA_GAMES : []).map(g => ({
  id: `endo-${g.id}`,
  titleKey: g.name,
  category: /\bdice\b/i.test(g.name) ? 'Table' : 'Slots',
  desc: 'Endorphina',
  accent: 'from-amber-500 to-red-800',
  tag: '',
  provider: 'ENDORPHINA',
  image: g.cover,
  path: `/games/endorphina/${g.id}`,
}));

// Popular alternates one PG SOFT title, one JILI title, so the tab shows a
// balanced mix of both providers.
const PG_POPULAR = PG_LOBBY_GAMES.filter(g => g.category === 'Popular');
const JILI_POPULAR = JILI_LOBBY_GAMES.filter(g => g.category === 'Popular');
const MIXED_POPULAR = [];
for (let i = 0; i < Math.max(PG_POPULAR.length, JILI_POPULAR.length); i++) {
  if (PG_POPULAR[i]) MIXED_POPULAR.push(PG_POPULAR[i]);
  if (JILI_POPULAR[i]) MIXED_POPULAR.push(JILI_POPULAR[i]);
}
const OTHER_PROVIDER_GAMES = [...PG_LOBBY_GAMES, ...JILI_LOBBY_GAMES].filter(g => g.category !== 'Popular');

const ALL_GAMES = [...GAMES, ...MIXED_POPULAR, ...ENDO_LOBBY_GAMES, ...OTHER_PROVIDER_GAMES];

// Temporarily hidden from the lobby (routes still work if opened directly).
// Remove an id from this list to show the game again.
const HIDDEN_GAME_IDS = [];

// Base tabs, plus any extra category that actually has games (e.g. "Other"
// when JILI ships a category we haven't mapped yet).
const BASE_CATEGORY_KEYS = ['All', 'Popular', 'Slots', 'Fishing', 'Cards', 'Table', 'Bingo', 'Arcade'];
const EXTRA_CATEGORIES = [...new Set(ALL_GAMES.map(g => g.category))].filter(c => !BASE_CATEGORY_KEYS.includes(c));
const CATEGORY_KEYS = [...BASE_CATEGORY_KEYS, ...EXTRA_CATEGORIES];

export default function Home() {
  const { t } = useLanguage();
  const [cat, setCat] = useState('All');
  // Only a slice of the (very large) catalogue is mounted at once — mounting
  // 180+ tiles is what made scrolling stutter.
  const [visible, setVisible] = useState(36);
  const pickCat = (c) => { setCat(c); setVisible(36); };
  const { toast } = useToast();
  const { balance, demoMode, setDemoMode } = useCasinoBalance();
  // Demo mode uses a practice balance, which PG SOFT titles can't run on — hide them.
  const baseGames = (demoMode ? GAMES : ALL_GAMES).filter(g => !HIDDEN_GAME_IDS.includes(g.id));
  const filtered = cat === 'All' ? baseGames : baseGames.filter(g => g.category === cat);
  const playable = baseGames.filter(g => !g.coming).length;
  // In Telegram fullscreen the native chrome (clock / close button) sits over the
  // very top of the page, so push the whole header down and leave space above it.
  const topInset = isInsideTelegram() ? 'calc(env(safe-area-inset-top, 0px) + 42px)' : '0.5rem';

  return (
    <div className="relative min-h-screen pb-24 lg:pl-20 bg-[#0b0b0d]">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.05), transparent 60%), url(https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat' }} />
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(10,9,8,0.35)', borderBottom: '1px solid rgba(214,178,98,0.06)' }}
      >
        <div className="max-w-none mx-auto pl-4 pr-0 lg:px-6 pb-0 flex items-center justify-between" style={{ paddingTop: topInset }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative z-30 shrink-0 self-end translate-y-[13px] w-12 h-12">
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
                className="absolute -top-[37px] left-1/2 translate-x-[calc(-50%+52px)] flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full transition-all active:scale-95 z-30"
                style={{
                  border: demoMode ? '1px solid rgba(74,222,128,0.6)' : '1px solid rgba(214,178,98,0.5)',
                  background: demoMode
                    ? 'linear-gradient(135deg, rgba(6,78,59,0.92), rgba(2,44,31,0.95))'
                    : 'linear-gradient(135deg, rgba(28,25,23,0.92), rgba(10,9,8,0.95))',
                  boxShadow: demoMode
                    ? '0 2px 10px rgba(0,0,0,0.6), 0 0 10px rgba(52,211,153,0.22), inset 0 1px 0 rgba(255,255,255,0.10)'
                    : '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(214,178,98,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <span className="relative flex items-center justify-center w-3.5 h-3.5">
                  <FlaskConical className={`w-3.5 h-3.5 ${demoMode ? 'text-emerald-300' : 'text-amber-400'}`} style={{ filter: demoMode ? 'drop-shadow(0 0 3px rgba(52,211,153,0.6))' : 'drop-shadow(0 0 3px rgba(214,178,98,0.5))' }} />
                </span>
                <span className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: demoMode ? '#6ee7b7' : '#e8c878' }}>Demo</span>
              </button>
              <Link
                to="/airdrop"
                title="Airdrop"
                className="absolute top-[2px] left-1/2 translate-x-[calc(-50%+26px)] flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full transition-all active:scale-95 z-30"
                style={{
                  border: '1px solid rgba(214,178,98,0.5)',
                  background: 'linear-gradient(135deg, rgba(28,25,23,0.92), rgba(10,9,8,0.95))',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(214,178,98,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <span className="relative flex items-center justify-center w-3.5 h-3.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" style={{ filter: 'drop-shadow(0 0 3px rgba(214,178,98,0.5))' }} />
                </span>
                <span className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#e8c878' }}>Airdrop</span>
              </Link>
            </div>
            <div className="flex-1 min-w-0 self-start">
              <FadeImage
                src="https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/c39869f00_file_000000003b6c821193c37e7c968d77f2.png"
                alt="Golden Bounty"
                className="-mt-6 translate-x-2 w-full"
                durationMs={400}
                style={{ height: '104px', objectFit: 'contain' }}
              />
              <p className="text-[11px] text-amber-100/55 tracking-wide -mt-4 text-center">{t('Play to Win ➤ Stack & Earn')}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 self-end mr-2 -translate-y-2">
            <span className="block -translate-x-[78px]"><NotificationBell /></span>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-95 -translate-x-[26px]"
              style={{
                border: demoMode ? '1px solid rgba(74,222,128,0.6)' : '1px solid rgba(214,178,98,0.5)',
                background: demoMode
                  ? 'linear-gradient(135deg, rgba(6,78,59,0.92), rgba(2,44,31,0.95))'
                  : 'linear-gradient(135deg, rgba(28,25,23,0.92), rgba(10,9,8,0.95))',
                boxShadow: demoMode
                  ? '0 2px 10px rgba(0,0,0,0.6), 0 0 10px rgba(52,211,153,0.22), inset 0 1px 0 rgba(255,255,255,0.10)'
                  : '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(214,178,98,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <Wallet className={`w-4 h-4 ${demoMode ? 'text-emerald-300' : 'text-amber-400'}`} style={{ filter: demoMode ? 'drop-shadow(0 0 3px rgba(52,211,153,0.6))' : 'drop-shadow(0 0 3px rgba(214,178,98,0.5))' }} />
              <span className="text-xs font-bold tabular-nums" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: demoMode ? '#6ee7b7' : '#e8c878' }}>
                ${balance.toFixed(2)}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Premium Western game banners */}
      <div className="relative z-10 max-w-none mx-auto px-4 lg:px-6 mt-0">
        <WesternGameBanners />
      </div>

      {/* Live activity ticker */}
      <div className="relative z-10"><LiveTicker /></div>

      {/* Two-column layout on desktop: sidebar + main */}
      <div className="relative z-10 max-w-none mx-auto px-4 lg:px-6 mt-6">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
          {/* Desktop sidebar */}
          <HomeSidebar cat={cat} setCat={pickCat} categories={CATEGORY_KEYS} />

          {/* Main column */}
          <div>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:overflow-visible">
              {CATEGORY_KEYS.map(c => (
                <button
                  key={c}
                  onClick={() => pickCat(c)}
                  className="px-4 py-2 rounded-[7px] text-sm font-bold italic whitespace-nowrap transition-colors lg:flex-1"
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

            {/* Game grid */}
            <main id="games" className="scroll-mt-20 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                {filtered.slice(0, visible).map(g => (
                  <CasinoGameCard key={g.id} game={{ ...g, title: t(g.titleKey) }} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisible(v => v + 36)}
                    className="px-5 py-2 rounded-[7px] text-sm font-bold italic"
                    style={{ fontFamily: 'Georgia, serif', border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.75)', color: '#e8c878' }}
                  >
                    {t('Show more games')}
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Airdrop banner */}
      <section className="relative z-10 max-w-none mx-auto px-4 lg:px-6 pb-2">
        <Link to="/airdrop" className="block relative overflow-hidden rounded-2xl transition-transform active:scale-[0.99]" style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <FadeImage
            src="https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/954aff594_file_00000000d7b081fab9598b09e1590c28.png"
            alt="Golden Bounty Airdrop — Claim BOUNTY tokens"
            className="w-full h-auto block"
            durationMs={500}
          />
        </Link>
      </section>

      <div className="relative z-10"><SiteFooter /></div>

      <DesktopSidebar />
      <div className="lg:hidden"><BottomNav /></div>
    </div>
  );
}