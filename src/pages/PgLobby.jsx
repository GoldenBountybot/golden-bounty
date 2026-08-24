import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CasinoGameCard from '@/components/CasinoGameCard';
import { PG_GAMES } from '@/lib/pgGames';

// Lobby listing every PG SOFT title. Each card opens the seamless-wallet
// launcher page, which asks our backend for the PG game HTML.
export default function PgLobby() {
  return (
    <div className="min-h-screen bg-[#0b0b0d] pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(10,9,8,0.8)', borderBottom: '1px solid rgba(214,178,98,0.15)' }}>
        <Link to="/" className="p-1.5 rounded-full" style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
          <ArrowLeft className="w-4 h-4 text-amber-300" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-black italic text-amber-200 pr-8"
          style={{ fontFamily: 'Georgia, serif' }}>PG SOFT</h1>
      </header>

      <div className="px-4 pt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {PG_GAMES.map((g) => (
          <CasinoGameCard key={g.id} game={{ ...g, tag: 'PG', path: `/games/pg/${g.id}` }} />
        ))}
      </div>
    </div>
  );
}