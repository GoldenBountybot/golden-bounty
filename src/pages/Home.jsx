import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CasinoGameCard from '@/components/CasinoGameCard';
import { Gamepad2, Coins } from 'lucide-react';

const GAMES = [
  { id: 'wild-bounty', title: 'Wild Bounty Showdown', category: 'Slots', desc: '3600 Ways · Cascade Wins', accent: 'from-amber-500 to-orange-700', tag: 'HOT' },
  { id: 'lucky-wheel', title: 'Lucky Wheel', category: 'Wheel', desc: 'Spin for Multipliers', accent: 'from-rose-500 to-red-700', tag: 'NEW' },
  { id: 'hi-lo', title: 'High or Low', category: 'Cards', desc: 'Guess the Next Card', accent: 'from-emerald-500 to-green-700' },
  { id: 'roulette', title: 'Golden Roulette', category: 'Table', desc: 'Place Your Bets', accent: 'from-yellow-500 to-amber-700', coming: true },
  { id: 'blackjack', title: 'Blackjack 21', category: 'Cards', desc: 'Beat the Dealer', accent: 'from-slate-500 to-slate-800', coming: true },
  { id: 'plinko', title: 'Plinko Drop', category: 'Arcade', desc: 'Drop & Win', accent: 'from-pink-500 to-fuchsia-700', coming: true },
  { id: 'mines', title: 'Minesweeper Gold', category: 'Arcade', desc: 'Find the Gold', accent: 'from-cyan-500 to-blue-700', coming: true },
  { id: 'crash', title: 'Rocket Crash', category: 'Arcade', desc: 'Cash Out in Time', accent: 'from-indigo-500 to-purple-700', coming: true },
  { id: 'dragon-tiger', title: 'Dragon Tiger', category: 'Cards', desc: 'Pick a Side', accent: 'from-red-600 to-orange-800', coming: true },
  { id: 'sic-bo', title: 'Sic Bo', category: 'Table', desc: 'Dice of Fortune', accent: 'from-teal-500 to-emerald-800', coming: true },
];

const CATEGORIES = ['All', 'Slots', 'Wheel', 'Cards', 'Table', 'Arcade'];

export default function Home() {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? GAMES : GAMES.filter(g => g.category === cat);
  const playable = GAMES.filter(g => !g.coming).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-emerald-950/90 backdrop-blur-xl border-b border-amber-600/30">
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-amber-600/40">
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-bold text-amber-200 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>Free Play</span>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="relative rounded-2xl overflow-hidden border border-amber-600/40 p-6 bg-gradient-to-r from-amber-900/60 via-stone-900/60 to-emerald-900/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,200,80,0.25),transparent_55%)]" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black italic text-amber-200 drop-shadow" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome to the Saloon
            </h2>
            <p className="text-sm text-amber-100/80 mt-1 max-w-md">
              Spin the reels of Wild Bounty Showdown, test your luck on the wheel, or read the cards. New games added often!
            </p>
            <Link
              to="/games/wild-bounty"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-sm font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 transition-colors"
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
      <main className="max-w-6xl mx-auto px-4 py-6">
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
    </div>
  );
}