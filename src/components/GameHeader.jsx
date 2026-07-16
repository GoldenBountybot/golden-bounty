import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ShareButton from '@/components/ShareButton';

// Shared header for casino game pages: back to lobby, centered title, share link.
export default function GameHeader({ title, accent = 'text-amber-200', border = 'border-amber-700/30' }) {
  return (
    <header className={`sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b ${border}`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <button onClick={() => { window.location.href = '/'; }} title="Back" className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-300 hover:text-amber-200 hover:bg-black/40 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <h1 className={`text-base font-black italic ${accent}`} style={{ fontFamily: 'Georgia, serif' }}>{title}</h1>
        </div>
        <ShareButton />
      </div>
    </header>
  );
}