import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CasinoGameCard from '@/components/CasinoGameCard';
import { PG_GAMES, PG_CATEGORIES } from '@/lib/pgGames';

// Lobby listing every PG SOFT title. Each card opens the seamless-wallet
// launcher page, which asks our backend for the PG game HTML.
export default function PgLobby() {
  const [cat, setCat] = useState('All');
  const games = PG_GAMES.filter((g) => g.cats.includes(cat));

  return (
    <div className="min-h-screen bg-[#0b0b0d] pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(10,9,8,0.85)', borderBottom: '1px solid rgba(214,178,98,0.15)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1.5 rounded-full" style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
            <ArrowLeft className="w-4 h-4 text-amber-300" />
          </Link>
          <h1 className="flex-1 text-center text-lg font-black italic text-amber-200 pr-8"
            style={{ fontFamily: 'Georgia, serif' }}>PG SOFT</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {PG_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-3.5 py-1.5 rounded-[7px] text-xs font-bold italic whitespace-nowrap"
              style={{
                fontFamily: 'Georgia, serif',
                border: cat === c ? '1px solid rgba(214,178,98,0.85)' : '1px solid rgba(214,178,98,0.3)',
                background: cat === c ? 'linear-gradient(to bottom,#f5c542,#c8881e)' : 'rgba(20,17,13,0.6)',
                color: cat === c ? '#2a1a06' : '#e8c878',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <p className="px-4 pt-3 text-[11px] text-amber-100/50">{games.length} games</p>

      <div className="px-4 pt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {games.map((g) => (
          <CasinoGameCard key={g.id} game={{ ...g, tag: 'PG', path: `/games/pg/${g.id}` }} />
        ))}
      </div>
    </div>
  );
}