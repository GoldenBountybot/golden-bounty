import React from 'react';
import { MULTIPLIERS } from './symbols';

// Bull-skull + wooden banner image acts as the multiplier ladder backdrop;
// the multiplier numbers overlay onto the wooden banner portion.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7be17c563_file_00000000b61481fabeec47bdbfaf5bfc.png';

export default function MultiplierBanner({ multIndex }) {
  const active = MULTIPLIERS[multIndex];
  // show a window of 5 around the active index
  const start = Math.max(0, multIndex - 2);
  const end = Math.min(MULTIPLIERS.length, start + 5);
  const view = MULTIPLIERS.slice(start, end);

  return (
    <div className="relative w-full">
      <img
        src={BANNER_IMG}
        alt="Multiplier banner"
        className="w-full h-auto block select-none"
        draggable={false}
      />

      {/* Multiplier ladder — overlaid on the wooden banner (lower portion) */}
      <div className="absolute inset-x-0 bottom-[14%] flex items-center justify-center pointer-events-none">
        <div className="flex items-center justify-center gap-[3.2%] sm:gap-[3.6%] px-[12%]">
          {view.map((m, i) => {
            const realIndex = start + i;
            const isActive = realIndex === multIndex;
            return (
              <span
                key={realIndex}
                className={`font-black italic transition-all leading-none
                  ${isActive ? 'text-[6.2vw] sm:text-[26px] text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.95)] scale-125' : 'text-[3.4vw] sm:text-sm text-amber-200/55'}`}
                style={{ fontFamily: 'Rye, Georgia, serif' }}
              >
                x{m}
              </span>
            );
          })}
        </div>
      </div>

      {/* Active big multiplier centered on the wood when ladder has advanced */}
      {multIndex > 0 && (
        <div className="absolute inset-x-0 bottom-[13%] flex items-center justify-center pointer-events-none">
          <span
            className="font-black italic text-yellow-300 drop-shadow-[0_0_14px_rgba(255,200,0,0.95)] animate-pulse leading-none"
            style={{ fontFamily: 'Rye, Georgia, serif', fontSize: 'clamp(34px, 11vw, 64px)' }}
          >
            x{active}
          </span>
        </div>
      )}
    </div>
  );
}