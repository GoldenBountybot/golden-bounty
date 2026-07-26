import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import WesternGameBanners from '@/components/WesternGameBanners';
import BottomNav from '@/components/BottomNav';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import { Wallet, FlaskConical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

const GAMES = [
  { id: 'free-spin', title: 'Daily Free Spin', category: 'Arcade', desc: 'Spin every 24h · win $1000', accent: 'from-amber-500 to-yellow-700', tag: 'FREE', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png', path: '/free-spin' },
  { id: 'wild-bounty', title: 'Wild Bounty Showdown', category: 'Slots', desc: '3600 Ways · Cascade Wins', accent: 'from-amber-500 to-orange-700', tag: 'HOT', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/af2b94fcd_InShot_20260717_194156078.jpg' },
  { id: 'hi-lo', title: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700' },
  { id: 'roulette', title: 'Golden Roulette', category: 'Table', desc: 'Place Your Bets', accent: 'from-yellow-500 to-amber-700', coming: true },
  { id: 'blackjack', title: 'Blackjack 21', category: 'Cards', desc: 'Beat the Dealer', accent: 'from-slate-500 to-slate-800', coming: true },
  { id: 'plinko', title: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/22ada4a2e_generated_image.png' },
  { id: 'fullhouse', title: 'JILI Super ACE', category: 'Cards', desc: 'Golden Wild · Free Spins', accent: 'from-amber-500 to-orange-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/199c00bd0_generated_image.png' },
  { id: 'mines', title: 'Mines', category: 'Arcade', desc: 'Find the Gems · Avoid the Mines', accent: 'from-cyan-500 to-blue-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/446327a76_mines.jpg' },
  { id: 'rocket-crash', title: 'Aviator', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/61f59a253_aviator-game-cover.png' },
  { id: 'crown-coins', title: 'Crown Coins', category: 'Slots', desc: 'Royal Treasury · 5 Lines', accent: 'from-amber-400 to-yellow-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ef3b69c4c_generated_image.png' },
  { id: 'big-brown', title: 'Big Brown', category: 'Slots', desc: '4096 Ways · Expanding Wilds', accent: 'from-amber-700 to-stone-900', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a6f715d21_generated_image.png' },
  { id: 'argonauts', title: 'Argonauts', category: 'Slots', desc: '10 Lines · Free Spins · Bonus', accent: 'from-sky-500 to-indigo-800', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png' },
  { id: 'gates-of-olympus', title: 'Gates of Olympus', category: 'Slots', desc: '8+ Pays · Tumbles · ×500 Mult', accent: 'from-indigo-500 to-amber-700', tag: 'HOT', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2125c8cfd_generated_image.png' },
  { id: 'dragon-tiger', title: 'Dragon Tiger', category: 'Cards', desc: 'Pick a Side', accent: 'from-red-600 to-orange-800', coming: true },
  { id: 'sic-bo', title: 'Sic Bo', category: 'Table', desc: 'Dice of Fortune', accent: 'from-teal-500 to-emerald-800', coming: true },
];

const CATEGORIES = ['All', 'Slots', 'Cards', 'Table', 'Arcade'];

export default function Home() {
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
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
      >
        <div className="max-w-6xl mx-auto pl-4 pr-0 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg"
              alt="Golden Bounty"
              className="w-12 h-12 shrink-0 self-end rounded-[8px] object-cover"
              style={{ border: '1px solid rgba(214,178,98,0.6)', boxShadow: '0 4px 12px rgba(200,136,30,0.4)' }}
            />
            <div className="flex-1 min-w-0 self-start">
              <WesternTitleBadge size="lg" fullWidth className="-mt-3">Golden Bounty</WesternTitleBadge>
              <p className="text-[11px] text-amber-100/55 tracking-wide mt-1 text-center">{playable} Games Live · Play & Win</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 self-end mr-0">
            <button
              onClick={() => {
                const next = !demoMode;
                setDemoMode(next);
                toast({ title: next ? 'Demo Mode ON · $1000 practice balance' : 'Demo Mode OFF · real balance restored' });
              }}
              title={demoMode ? 'Demo mode is ON' : 'Enable demo mode'}
              className="flex items-center gap-1 px-2 py-1 mr-3 rounded-[6px] transition-all active:scale-95"
              style={{
                border: demoMode ? '1px solid rgba(74,222,128,0.75)' : '1px solid rgba(214,178,98,0.45)',
                background: demoMode ? 'rgba(34,197,94,0.18)' : 'rgba(20,17,13,0.6)',
              }}
            >
              <FlaskConical className={`w-3 h-3 ${demoMode ? 'text-emerald-300' : 'text-amber-400'}`} />
              <span className="text-[10px] font-black italic tracking-wide" style={{ fontFamily: 'Georgia, serif', color: demoMode ? '#bbf7d0' : '#e8c878' }}>DEMO</span>
            </button>
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
      <div className="max-w-6xl mx-auto px-4 pt-5">
        <WesternGameBanners />
      </div>

      {/* Category tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(c => (
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
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Game grid */}
      <main id="games" className="max-w-6xl mx-auto px-4 py-6 scroll-mt-20">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map(g => (
            <CasinoGameCard key={g.id} game={g} />
          ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-[11px] text-amber-100/40 italic" style={{ fontFamily: 'Georgia, serif' }}>
          Golden Bounty · Play Games, Try Your Luck · Stack and Earn Money
        </p>
      </footer>

      <BottomNav />
    </div>
  );
}