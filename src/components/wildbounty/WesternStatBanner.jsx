import React from 'react';

// Premium western wooden plaque banner for stat displays (Balance/Bet/Win).
const WOOD_URL =
  'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/8252d57aa_generated_image.png';

const STUD = 'absolute w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_4px_rgba(255,210,120,0.9)]';

export default function WesternStatBanner({ icon: Icon, label, value, glow = false }) {
  return (
    <div
      className="relative flex-1 flex items-center rounded-md overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(40,26,14,0.5), rgba(20,14,8,0.6)), url(${WOOD_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: glow
          ? '0 0 12px rgba(255,200,80,0.5), 0 0 0 2px rgba(200,150,60,0.6), 0 3px 6px rgba(0,0,0,0.65)'
          : '0 0 0 2px rgba(120,80,30,0.85), 0 0 0 3px rgba(200,150,60,0.45), inset 0 1px 0 rgba(255,210,120,0.25), 0 3px 6px rgba(0,0,0,0.65)',
        border: '1px solid rgba(190,140,55,0.7)',
      }}
    >
      {/* gold inner trim */}
      <span className="pointer-events-none absolute inset-0 rounded-md" style={{ boxShadow: 'inset 0 0 0 1px rgba(46,30,12,0.6)' }} />
      {/* corner studs */}
      <span className={`${STUD} top-1 left-1`} />
      <span className={`${STUD} top-1 right-1`} />
      <span className={`${STUD} bottom-1 left-1`} />
      <span className={`${STUD} bottom-1 right-1`} />

      <div className="relative flex items-center gap-2 px-2.5 py-2 w-full">
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #f3d77a, #c8932e 45%, #7a4f17 78%, #4a2f10)',
            boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.6), inset 0 -2px 3px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.65)',
            border: '1px solid rgba(46,30,12,0.8)',
          }}
        >
          <Icon
            className="w-4 h-4 text-stone-900"
            strokeWidth={2.4}
            style={{ filter: 'drop-shadow(0 1px 0 rgba(255,240,180,0.5)) drop-shadow(0 -1px 0 rgba(0,0,0,0.4))' }}
          />
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className="text-[9px] italic text-amber-300/90 tracking-[0.18em] uppercase"
            style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 1px rgba(0,0,0,0.7)' }}
          >
            {label}
          </span>
          <span
            className="text-sm font-bold italic text-yellow-100 tabular-nums truncate"
            style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(255,200,80,0.25)' }}
          >
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}