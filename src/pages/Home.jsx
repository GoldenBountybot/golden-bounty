import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import WesternGameBanners from '@/components/WesternGameBanners';
import BottomNav from '@/components/BottomNav';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import { Gamepad2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

const GAMES = [
  { id: 'wild-bounty', title: 'Wild Bounty Showdown', category: 'Slots', desc: '3600 Ways · Cascade Wins', accent: 'from-amber-500 to-orange-700', tag: 'HOT', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/af2b94fcd_InShot_20260717_194156078.jpg' },
  { id: 'hi-lo', title: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700' },
  { id: 'roulette', title: 'Golden Roulette', category: 'Table', desc: 'Place Your Bets', accent: 'from-yellow-500 to-amber-700', coming: true },
  { id: 'blackjack', title: 'Blackjack 21', category: 'Cards', desc: 'Beat the Dealer', accent: 'from-slate-500 to-slate-800', coming: true },
  { id: 'plinko', title: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/22ada4a2e_generated_image.png' },
  { id: 'fullhouse', title: 'JILI Super ACE', category: 'Cards', desc: 'Golden Wild · Free Spins', accent: 'from-amber-500 to-orange-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/199c00bd0_generated_image.png' },
  { id: 'mines', title: 'Mines', category: 'Arcade', desc: 'Find the Gems · Avoid the Mines', accent: 'from-cyan-500 to-blue-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/446327a76_mines.jpg' },
  { id: 'rocket-crash', title: 'Aviator', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/61f59a253_aviator-game-cover.png' },
  { id: 'crown-coins', title: 'Crown Coins', category: 'Slots', desc: 'Royal Treasury · 5 Lines', accent: 'from-amber-400 to-yellow-700', tag: 'NEW', image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ef3b69c4c_generated_image.png' },
  { id: 'dragon-tiger', title: 'Dragon Tiger', category: 'Cards', desc: 'Pick a Side', accent: 'from-red-600 to-orange-800', coming: true },
  { id: 'sic-bo', title: 'Sic Bo', category: 'Table', desc: 'Dice of Fortune', accent: 'from-teal-500 to-emerald-800', coming: true },
];

const CATEGORIES = ['All', 'Slots', 'Cards', 'Table', 'Arcade'];

export default function Home() {
  const [cat, setCat] = useState('All');
  const { toast } = useToast();
  const { balance } = useCasinoBalance();
  const filtered = cat === 'All' ? GAMES : GAMES.filter(g => g.category === cat);
  const playable = GAMES.filter(g => !g.coming).length;

  return (
    <div className="min-h-screen pb-24 bg-[#0b0b0d]">
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 shrink-0 rounded-[8px] flex items-center justify-center"
              style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'linear-gradient(to bottom,#f5c542,#c8881e)', boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.5), 0 4px 12px rgba(200,136,30,0.4)' }}
            >
              <Gamepad2 className="w-5 h-5 text-stone-950" />
            </div>
            <div className="flex-1 min-w-0">
              <WesternTitleBadge size="lg" fullWidth>Golden Bounty</WesternTitleBadge>
              <p className="text-[11px] text-amber-100/55 tracking-wide mt-1 text-center">{playable} Games Live · Play & Win</p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] transition-colors"
            style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
              ${balance.toFixed(2)}
            </span>
          </Link>
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
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
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