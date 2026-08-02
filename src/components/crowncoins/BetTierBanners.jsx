import React from 'react';

// Four bet-tier banners positioned around the main CROWN COINS banner.
// Layout (matching the reference): MAX top-left, ULTRA top-right,
// MID bottom-left, MIN bottom-right. Amounts scale with the current bet.
const TIERS = {
  MAX:   { mult: 150,  bg: '#5a0a8a', border: '#9a3ad4' }, // rich purple
  ULTRA: { mult: 1000, bg: '#7a0e1c', border: '#c43040' }, // deep burgundy
  MID:   { mult: 50,   bg: '#0a2a8a', border: '#2a55d4' }, // royal blue
  MIN:   { mult: 30,   bg: '#0a6b2a', border: '#1ea64a' }, // forest green
};

function TierBanner({ tierKey, bet }) {
  const tier = TIERS[tierKey];
  const amount = bet * tier.mult;
  return (
    <div
      className="relative flex flex-col items-center justify-center px-1.5 py-0.5"
      style={{
        background: `linear-gradient(to bottom, ${tier.border}, ${tier.bg})`,
        border: '2px solid #d4af37',
        boxShadow:
          'inset 0 0 0 1px #8a5a00, inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 5px rgba(0,0,0,0.6)',
        clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)',
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
        {tierKey}
      </span>
      <span
        className="leading-none tabular-nums"
        style={{
          fontSize: '11px',
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

// Corner wrapper — absolutely places a banner at one of the four corners
// of the relative banner container, offset outward so it never overlaps
// the centered main banner.
function Corner({ pos, children }) {
  const base = 'absolute z-10';
  const styles = {
    'top-left':    { top: '0',    left: '0' },
    'top-right':   { top: '0',    right: '0' },
    'bottom-left': { bottom: '0', left: '0' },
    'bottom-right':{ bottom: '0', right: '0' },
  };
  return <div className={base} style={styles[pos]}>{children}</div>;
}

export default function BetTierBanners({ bet }) {
  return (
    <>
      <Corner pos="top-left"><TierBanner tierKey="MAX" bet={bet} /></Corner>
      <Corner pos="top-right"><TierBanner tierKey="ULTRA" bet={bet} /></Corner>
      <Corner pos="bottom-left"><TierBanner tierKey="MID" bet={bet} /></Corner>
      <Corner pos="bottom-right"><TierBanner tierKey="MIN" bet={bet} /></Corner>
    </>
  );
}