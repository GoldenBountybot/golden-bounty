import React from 'react';
import BackButton from '@/components/BackButton';
import ShareButton from '@/components/ShareButton';
import { Wallet } from 'lucide-react';

// Shared header for casino game pages: back to lobby, centered title, share link.
// Optional `balance` renders a wallet chip next to the title.
export default function GameHeader({ title, accent = 'text-amber-200', border = 'border-amber-700/30', balance }) {
  return (
    <header className={`sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b ${border}`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <BackButton />
        <div className="flex-1 flex items-center justify-center gap-2">
          <h1 className={`text-base font-black italic ${accent}`} style={{ fontFamily: 'Georgia, serif' }}>{title}</h1>
          {typeof balance === 'number' && (
            <span className="flex items-center gap-1 rounded-full bg-black/40 border border-indigo-700/40 px-2 py-0.5 text-[11px] font-bold tabular-nums text-yellow-100">
              <Wallet className="w-3.5 h-3.5 text-yellow-300" />
              ${balance.toFixed(2)}
            </span>
          )}
        </div>
        <ShareButton />
      </div>
    </header>
  );
}