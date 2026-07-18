import React from 'react';
import { Sparkles, Star } from 'lucide-react';

const W = { fontFamily: 'Rye, Georgia, serif' };

// Western gold-trimmed wooden interstitial shown before the free-spin round begins.
export default function FreeSpinStart({ spins = 10, onStart }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(20,60,60,0.55), rgba(4,9,10,0.92))' }}
    >
      {/* burst backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(245,197,66,0.35), transparent 55%)',
      }} />

      <div
        className="relative w-full max-w-xs text-center rounded-2xl px-6 py-8"
        style={{
          background: 'linear-gradient(to bottom, #5a2410 0%, #3a160b 55%, #1f0d07 100%)',
          border: '3px solid #f5c542',
          boxShadow:
            '0 0 28px rgba(245,197,66,0.55), inset 0 0 0 2px rgba(120,80,10,0.55), inset 0 1px 6px rgba(255,210,120,0.25), 0 8px 30px rgba(0,0,0,0.7)',
        }}
      >
        {/* corner stars */}
        <Star className="absolute top-2 left-2 w-4 h-4" style={{ color: '#f5c542', fill: '#f5c542' }} />
        <Star className="absolute top-2 right-2 w-4 h-4" style={{ color: '#f5c542', fill: '#f5c542' }} />
        <Star className="absolute bottom-2 left-2 w-4 h-4" style={{ color: '#f5c542', fill: '#f5c542' }} />
        <Star className="absolute bottom-2 right-2 w-4 h-4" style={{ color: '#f5c542', fill: '#f5c542' }} />

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="w-4 h-4" style={{ color: '#f5c542' }} />
          <span className="text-[10px] tracking-[0.35em]" style={{ color: '#f5c542', ...W }}>BONUS</span>
          <Sparkles className="w-4 h-4" style={{ color: '#f5c542' }} />
        </div>

        <h1
          className="text-3xl font-black italic leading-none mb-2"
          style={{
            color: '#fde68a',
            textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 14px rgba(245,197,66,0.6)',
            ...W,
          }}
        >
          FREE<br />SPINS
        </h1>

        <div className="mx-auto my-3 w-20 border-t" style={{ borderColor: 'rgba(245,197,66,0.5)' }} />

        <div className="mb-5">
          <span className="block text-[10px] tracking-widest" style={{ color: 'rgba(243,226,179,0.8)', ...W }}>YOU WON</span>
          <span
            className="text-4xl font-black tabular-nums"
            style={{ color: '#f5c542', textShadow: '0 0 12px rgba(245,197,66,0.7)', fontFamily: 'Georgia, serif' }}
          >
            {spins}
          </span>
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-xl text-sm font-black italic"
          style={{
            background: 'radial-gradient(circle at 50% 40%, #fff3c4, #f5c542 45%, #c8881e 88%)',
            border: '2px solid #fde68a',
            color: '#5a1010',
            boxShadow: '0 0 14px rgba(245,197,66,0.85), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(120,70,10,0.5)',
            ...W,
          }}
        >
          START FREE SPIN
        </button>
      </div>
    </div>
  );
}