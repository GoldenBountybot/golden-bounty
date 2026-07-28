import React from 'react';
import { MULTIPLIERS } from './symbols';

// Arc-text multiplier strip overlaid on the BoardTopBanner wooden plaque.
//
// The strip is a sliding window of 5 consecutive multipliers from the
// circular sequence [1,2,4,8,...,512,1024]. The centre slot always holds the
// CURRENT round multiplier (upright, larger) and lights up while symbols are
// matching. Each new cascade shifts the whole window one step left: the new
// tier takes the centre (lit), the previous one slides to the left slot, and
// a fresh multiplier enters from the right. The leftmost slot falls off and
// is no longer visible — exactly like the spec:
//   X2 → centre, X1 → X1024's old slot, X1024 → X512's old slot, X512 gone.
//
// Off-centre characters sit on an elliptical arc (sagging U-curve) and are
// rotated to the tangent for true "warp text".

const CX = 150;   // arc centre x (width units)
const RX = 116;   // horizontal radius
const CY = 17;    // arc centre y (height units) — sits above the board
const RY = 39;    // vertical radius
const W = 300, H = 100;

const N = MULTIPLIERS.length; // 11 tiers

// Fixed arc centre angles + sizes for the four off-centre slots. Farther
// slots are smaller (perspective). The centre slot stays upright.
const SLOTS = {
  left2:  { centerA: -0.62, size: '0.72rem' }, // far left  (was X512)
  left1:  { centerA: -0.28, size: '0.64rem' }, // left      (was X1024)
  right1: { centerA:  0.28, size: '1.0rem'  }, // right     (was X2)
  right2: { centerA:  0.62, size: '1.0rem'  }, // far right (was X4)
};

// The deep-gold gradient / 3D bevel / stroke live in the `.wb-deep-gold` class
// (shared with the win banner) so both banners stay pixel-identical. Here we
// only add layout + a warm outer glow so the gold lifts off the dark wooden
// banner instead of fading into it.
function metallicStyle(size, lit) {
  const style = {
    fontSize: size,
    fontFamily: 'Rye, Georgia, serif',
    whiteSpace: 'nowrap',
    position: 'absolute',
    transformOrigin: 'center center',
    zIndex: 5,
  };
  if (lit) {
    style.filter =
      'drop-shadow(0 0 6px rgba(255,220,120,0.95)) ' +
      'drop-shadow(0 0 14px rgba(255,180,60,0.8)) ' +
      'brightness(1.4)';
    style.animation = 'wbMultLit 1.3s ease-in-out infinite';
    style.zIndex = 8;
  }
  return style;
}

// Render a single warped multiplier: each character on the arc at the slot's
// centre angle, evenly spaced, rotated to the tangent.
function ArcWord({ label, centerA, size, lit, nudgeY = 3 }) {
  const charW = label.length >= 5 ? 0.045 : 0.06;
  const chars = label.split('');
  const n = chars.length;
  const start = centerA - ((n - 1) / 2) * charW;
  return chars.map((ch, i) => {
    const a = start + i * charW;
    const x = CX + RX * Math.sin(a);
    const y = CY + RY * Math.cos(a);
    const leftPct = (x / W) * 100;
    const topPct = (y / H) * 100 + nudgeY;
    const rotDeg = -a * (180 / Math.PI);
    return (
      <span
        key={`${label}-${i}`}
        className="wb-deep-gold"
        style={{
          ...metallicStyle(size, lit),
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: `translate(-50%, -50%) rotate(${rotDeg}deg)`,
        }}
      >
        {ch}
      </span>
    );
  });
}

export default function MultiplierStrip({ multIndex = 0, lit = false, className = '' }) {
  // The centre shows the multiplier of the most-recent cascade win. multIndex
  // is incremented *after* a win is computed, so while a win is showing the
  // active tier is multIndex - 1. When idle, show the base tier (multIndex).
  const displayIndex = lit ? Math.max(0, multIndex - 1) : multIndex;
  const at = (off) => MULTIPLIERS[(displayIndex + off + N * 2) % N];

  const centerLabel = `X${MULTIPLIERS[displayIndex]}`;
  const centerStyle = {
    ...metallicStyle('2.4rem', lit),
    left: '50%',
    top: '58%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Left side — passed / lower multipliers, following the left-upward curve */}
      <ArcWord label={`X${at(-2)}`} centerA={SLOTS.left2.centerA} size={SLOTS.left2.size} />
      <ArcWord label={`X${at(-1)}`} centerA={SLOTS.left1.centerA} size={SLOTS.left1.size} />
      {/* Centre — current multiplier, upright; lights up while matching */}
      <span key={displayIndex} className="wb-deep-gold" style={centerStyle}>{centerLabel}</span>
      {/* Right side — upcoming multipliers, following the right-upward curve */}
      <ArcWord label={`X${at(1)}`} centerA={SLOTS.right1.centerA} size={SLOTS.right1.size} />
      <ArcWord label={`X${at(2)}`} centerA={SLOTS.right2.centerA} size={SLOTS.right2.size} />
    </div>
  );
}