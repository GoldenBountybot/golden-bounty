import React from 'react';

export default function FreeSpinStart({ count, onStart }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-600 bg-gradient-to-b from-amber-950 to-stone-950 px-10 py-7 shadow-2xl shadow-amber-900/50">
        <span className="text-amber-400 text-xs font-bold italic tracking-[0.3em]" style={{ fontFamily: 'Georgia, serif' }}>FREE SPINS</span>
        <span
          className="text-6xl font-black italic text-yellow-300 drop-shadow-[0_0_12px_rgba(255,200,0,0.8)]"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {count}
        </span>
        <button
          onClick={onStart}
          className="mt-1 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 px-10 py-2 text-2xl font-black italic text-amber-950 tracking-[0.2em] shadow-lg shadow-amber-700/50 active:scale-95 transition-transform"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          START
        </button>
      </div>
    </div>
  );
}