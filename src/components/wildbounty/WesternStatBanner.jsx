import React from 'react';

// Premium western wooden plaque banner for stat displays (Balance/Bet/Win).
const WOOD_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8252d57aa_generated_image.png';

export default function WesternStatBanner({ icon: Icon, label, value, glow = false }) {
  return (
    <div
      className="relative flex-1 flex items-center gap-1.5 rounded-md overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(40,26,14,0.55), rgba(20,14,8,0.65)), url(${WOOD_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: glow
          ? '0 0 10px rgba(255,200,80,0.45), 0 2px 5px rgba(0,0,0,0.6)'
          : 'inset 0 1px 0 rgba(255,210,120,0.25), 0 2px 5px rgba(0,0,0,0.6)',
        border: '1px solid rgba(190,140,55,0.7)',
      }}
    >
      {/* gold inner trim */}
      <span className="pointer-events-none absolute inset-0 rounded-md" style={{ boxShadow: 'inset 0 0 0 1px rgba(46,30,12,0.6)' }} />
      <div className="relative flex items-center gap-1.5 px-2 py-1.5 w-full">
        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #e0b34a, #7a4f17 60%, #c8932e)',
            boxShadow: 'inset 0 1px 0 rgba(255,230,160,0.5), 0 1px 2px rgba(0,0,0,0.6)',
            border: '1px solid rgba(46,30,12,0.7)',
          }}
        >
          <Icon className="w-3.5 h-3.5 text-stone-900" strokeWidth={2.4} />
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[8px] text-amber-300/80 tracking-[0.15em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
            {label}
          </span>
          <span className="text-xs font-bold italic text-yellow-100 tabular-nums truncate" style={{ fontFamily: 'Georgia, serif' }}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}