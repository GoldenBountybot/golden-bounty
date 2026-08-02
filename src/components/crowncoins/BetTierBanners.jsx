import React from 'react';

// Four bet-tier banners (MIN / MID / MAX / ULTRA) shown around the Crown Coins
// top banner. The displayed amount scales with the current bet so the tiers
// always stay proportional to the base bet ($0.10 → 3 / 5 / 15 / 100).
const TIERS = [
  { key: 'MIN',  mult: 30,   bg: '#0a6b2a', border: '#1ea64a' }, // forest green
  { key: 'MID',  mult: 50,   bg: '#0a2a8a', border: '#2a55d4' }, // royal blue
  { key: 'MAX',  mult: 150,  bg: '#5a0a8a', border: '#9a3ad4' }, // rich purple
  { key: 'ULTRA', mult: 1000, bg: '#7a0e1c', border: '#c43040' }, // deep burgundy
];

function TierBanner({ tier, bet }) {
  const amount = bet * tier.mult;
  return (
    <div
      className="relative flex flex-col items-center justify-center px-1 py-0.5"
      style={{
        background: `linear-gradient(to bottom, ${tier.border}, ${tier.bg})`,
        border: '2px solid #d4af37',
        boxShadow:
          'inset 0 0 0 1px #8a5a00, inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 5px rgba(0,0,0,0.6)',
        clipPath: 'polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)',
        minWidth: 0,
      }}
    >
      <span
        className="leading-none tracking-wider"
        style={{
          fontSize: '8px',
          fontFamily: 'Georgia, serif',
          fontWeight: 900,
          background: 'linear-gradient(to bottom, #fff7d6, #ffe9a8 30%, #f5c542 60%, #c8881e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 0 #5a3a06) drop-shadow(0 0 2px rgba(0,0,0,0.9))',
        }}
      >
        {tier.key}
      </span>
      <span
        className="leading-none tabular-nums"
        style={{
          fontSize: '12px',
          fontFamily: 'Georgia, serif',
          fontWeight: 900,
          background: 'linear-gradient(to bottom, #fff7d6, #ffe9a8 30%, #f5c542 60%, #c8881e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 0 #5a3a06) drop-shadow(0 0 2px rgba(0,0,0,0.9))',
        }}
      >
        ${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}
      </span>
    </div>
  );
}

export default function BetTierBanners({ bet }) {
  return (
    <div className="grid grid-cols-4 gap-1 w-full">
      {TIERS.map((t) => (
        <TierBanner key={t.key} tier={t} bet={bet} />
      ))}
    </div>
  );
}