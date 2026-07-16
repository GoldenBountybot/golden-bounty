import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ShareButton from '@/components/ShareButton';

// Shared header for casino game pages: back to lobby, centered title, share link.
export default function GameHeader({ title, accent = 'text-amber-200', border = 'border-amber-700/30' }) {
  return (
    <header className={`sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b ${border}`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <button onClick={() => { window.location.href = '/'; }} className="flex items-center gap-1.5 text-stone-300 hover:text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm italic tracking-wide">Lobby</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className={`text-base font-black italic ${accent}`} style={{ fontFamily: 'Georgia, serif' }}>{title}</h1>
        </div>
        <ShareButton />
      </div>
    </header>
  );
}