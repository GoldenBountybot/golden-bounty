import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import { Gamepad2, LayoutDashboard, Gift, Users, Play, UserCircle, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

const GAMES = [
  { id: 'wild-bounty', title: 'Wild Bounty Showdown', category: 'Slots', desc: '3600 Ways · Cascade Wins', accent: 'from-amber-500 to-orange-700', tag: 'HOT' },
  { id: 'lucky-wheel', title: 'Lucky Wheel', category: 'Wheel', desc: 'Spin for Multipliers', accent: 'from-rose-500 to-red-700', tag: 'NEW' },
  { id: 'hi-lo', title: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700' },
  { id: 'roulette', title: 'Golden Roulette', category: 'Table', desc: 'Place Your Bets', accent: 'from-yellow-500 to-amber-700', coming: true },
  { id: 'blackjack', title: 'Blackjack 21', category: 'Cards', desc: 'Beat the Dealer', accent: 'from-slate-500 to-slate-800', coming: true },
  { id: 'plinko', title: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', tag: 'NEW' },
  { id: 'mines', title: 'Mines Gold', category: 'Arcade', desc: 'Find the Gold', accent: 'from-cyan-500 to-blue-700', tag: 'NEW' },
  { id: 'crash', title: 'Rocket Crash', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', coming: true },
  { id: 'dragon-tiger', title: 'Dragon Tiger', category: 'Cards', desc: 'Pick a Side', accent: 'from-red-600 to-orange-800', coming: true },
  { id: 'sic-bo', title: 'Sic Bo', category: 'Table', desc: 'Dice of Fortune', accent: 'from-teal-500 to-emerald-800', coming: true },
];

const CATEGORIES = ['All', 'Slots', 'Wheel', 'Cards', 'Table', 'Arcade'];

export default function Home() {
  const [cat, setCat] = useState('All');
  const { toast } = useToast();
  const { balance } = useCasinoBalance();
  const filtered = cat === 'All' ? GAMES : GAMES.filter(g => g.category === cat);
  const playable = GAMES.filter(g => !g.coming).length;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-700/40">
              <Gamepad2 className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <h1 className="text-xl font-black italic text-amber-200 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                Golden Bounty Casino
              </h1>
              <p className="text-[11px] text-amber-100/70 tracking-wide">{playable} Games Live · Play & Win</p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 border border-amber-600/50 hover:border-amber-400/70 hover:bg-black/60 transition-colors"
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
              ${balance.toFixed(2)}
            </span>
          </Link>
        </div>
      </header>

      {/* Hero shield plaque */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-600/60 shadow-2xl shadow-amber-900/50">
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11bb10de3_InShot_20260715_212512483.jpg"
            alt="Golden Bounty Saloon"
            className="w-full h-72 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-3xl sm:text-4xl font-black italic text-amber-200 drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]" style={{ fontFamily: 'Georgia, serif' }}>
              Golden Bounty Casino
            </h2>
            <p className="text-sm sm:text-base text-amber-100/90 mt-2 max-w-sm italic" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome to the Saloon — spin, wager & win the bounty of the West.
            </p>
            <Link
              to="/games/wild-bounty"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-sm font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 transition-colors"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <Gamepad2 className="w-4 h-4" /> Play Wild Bounty
            </Link>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold italic whitespace-nowrap transition-colors border ${cat === c ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/30 hover:bg-black/50'}`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Game grid */}
      <main id="games" className="max-w-6xl mx-auto px-4 py-6 scroll-mt-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(g => (
            <CasinoGameCard key={g.id} game={g} />
          ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-[11px] text-amber-100/40 italic" style={{ fontFamily: 'Georgia, serif' }}>
          Golden Bounty Casino · Play responsibly · For entertainment only
        </p>
      </footer>

      {/* Bottom quick actions — fixed at the very bottom */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-amber-700/40 bg-stone-950/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-5 gap-2">
          <Link to="/dashboard" className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-black/30 border border-amber-700/40 hover:bg-black/50 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-amber-300" />
            <span className="text-[11px] font-bold italic text-amber-100/90" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</span>
          </Link>
          <Link to="/dashboard?tab=referral" className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-black/30 border border-amber-700/40 hover:bg-black/50 transition-colors">
            <Users className="w-5 h-5 text-amber-300" />
            <span className="text-[11px] font-bold italic text-amber-100/90" style={{ fontFamily: 'Georgia, serif' }}>Referral</span>
          </Link>
          <button
            onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-gradient-to-b from-amber-400 to-orange-600 border border-amber-300 hover:from-amber-300 hover:to-orange-500 transition-colors"
          >
            <Play className="w-5 h-5 text-stone-950" />
            <span className="text-[11px] font-black italic text-stone-950" style={{ fontFamily: 'Georgia, serif' }}>Play Game</span>
          </button>
          <Link to="/dashboard?tab=bonus" className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-black/30 border border-amber-700/40 hover:bg-black/50 transition-colors">
            <Gift className="w-5 h-5 text-amber-300" />
            <span className="text-[11px] font-bold italic text-amber-100/90" style={{ fontFamily: 'Georgia, serif' }}>Bonus</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-black/30 border border-amber-700/40 hover:bg-black/50 transition-colors">
            <UserCircle className="w-5 h-5 text-amber-300" />
            <span className="text-[11px] font-bold italic text-amber-100/90" style={{ fontFamily: 'Georgia, serif' }}>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}