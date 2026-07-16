import React from 'react';
import { MULTIPLIERS } from './symbols';

// Shows the multiplier ladder hanging from chains; active one is highlighted.
export default function MultiplierBanner({ multIndex }) {
  const active = MULTIPLIERS[multIndex];
  // show a window of 5 around the active index
  const start = Math.max(0, multIndex - 2);
  const end = Math.min(MULTIPLIERS.length, start + 5);
  const view = MULTIPLIERS.slice(start, end);

  return (
    <div className="relative">
      {/* chains */}
      <div className="flex justify-between px-8 -mb-1">
        <div className="w-0.5 h-3 bg-stone-500" />
        <div className="w-0.5 h-3 bg-stone-500" />
      </div>
      <div
        className="rounded-lg px-3 py-2 shadow-lg"
        style={{
          backgroundImage:
            'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/88b423add_InShot_20260715_212417291.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex items-center justify-center gap-1">
          {view.map((m, i) => {
            const realIndex = start + i;
            const isActive = realIndex === multIndex;
            return (
              <span
                key={realIndex}
                className={`font-serif font-black italic transition-all
                  ${isActive ? 'text-base sm:text-lg text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)] scale-125' : 'text-xs sm:text-sm text-amber-200/40'}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                x{m}
              </span>
            );
          })}
        </div>
      </div>
      {multIndex > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-serif font-black italic text-3xl sm:text-5xl text-yellow-300 drop-shadow-[0_0_12px_rgba(255,200,0,0.9)] animate-pulse" style={{ fontFamily: 'Georgia, serif' }}>
            x{active}
          </span>
        </div>
      )}
    </div>
  );
}