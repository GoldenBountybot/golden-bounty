import React from 'react';

// Arc-text multiplier strip overlaid on the BoardTopBanner wooden plaque.
//
// Each individual character of X512, X1024, X2 and X4 is placed on an
// elliptical arc — the banner's sagging U-curve (centre low, ends high) —
// and rotated to the arc tangent, giving true per-letter "warp text" that
// follows the wooden board's top edge. The central X1 stays upright,
// large and unchanged.
//
// Coordinates are normalised: width 300 units, height 100 units (matching
// the banner's ~3:1 aspect), so the ellipse maps to a clear arc in pixels.

const CX = 150;   // arc centre x (width units)
const RX = 138;   // horizontal radius
const CY = 8;     // arc centre y (height units) — sits above the board
const RY = 68;    // vertical radius  → centre low (top ~76%), edges high (top ~51%)
const W = 300, H = 100;

const CHAR_W = 0.105;  // angular width per character (radians) — even spacing

// Centre angle (radians) for each warped multiplier along the arc.
const CENTERS = {
  '512':  -0.88,
  '1024': -0.45,
  '2':     0.45,
  '4':     0.88,
};

function metallicStyle(size, red) {
  return {
    fontFamily: 'Rye, Georgia, serif',
    fontSize: size,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    color: 'transparent',
    background: red
      ? 'linear-gradient(180deg,#ffc0a8 0%,#e0553a 38%,#a62b1a 64%,#5a1208 100%)'
      : 'linear-gradient(180deg,#fff8da 0%,#f3dd82 34%,#cda23c 60%,#7a4f1e 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    WebkitTextStroke: '0.5px rgba(58,36,16,0.65)',
    textShadow:
      '0 1px 0 rgba(255,250,220,0.9),' +
      '0 -1px 0 rgba(58,36,16,0.95),' +
      '1px 0 0 rgba(255,245,200,0.5),' +
      '-1px 0 0 rgba(58,36,16,0.5),' +
      '0 2px 2px rgba(0,0,0,0.85),' +
      '0 4px 6px rgba(0,0,0,0.6)',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))',
    whiteSpace: 'nowrap',
    position: 'absolute',
    transformOrigin: 'center center',
    zIndex: 6,
  };
}

// Render a single warped multiplier: each character on the arc at the
// multiplier's centre angle, evenly spaced, rotated to the tangent.
function ArcWord({ label, centerA, size, red }) {
  const chars = label.split('');
  const n = chars.length;
  const start = centerA - ((n - 1) / 2) * CHAR_W;
  return chars.map((ch, i) => {
    const a = start + i * CHAR_W;
    const x = CX + RX * Math.sin(a);
    const y = CY + RY * Math.cos(a);
    const leftPct = (x / W) * 100;
    const topPct = (y / H) * 100;
    const rotDeg = -a * (180 / Math.PI);
    return (
      <span
        key={`${label}-${i}`}
        style={{
          ...metallicStyle(size, red),
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

export default function MultiplierStrip({ className = '' }) {
  // Centre X1 — upright, large, unchanged, at the lowest point of the arc.
  const x1Style = {
    ...metallicStyle('1.9rem', false),
    left: '50%',
    top: '76%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Left side — follows the left-downward curve */}
      <ArcWord label="X512"  centerA={CENTERS['512']}  size="0.95rem" red={false} />
      <ArcWord label="X1024" centerA={CENTERS['1024']} size="0.95rem" red={true} />
      {/* Centre — X1 stays upright and unchanged */}
      <span style={x1Style}>X1</span>
      {/* Right side — follows the right-downward curve */}
      <ArcWord label="X2" centerA={CENTERS['2']} size="0.95rem" red={false} />
      <ArcWord label="X4" centerA={CENTERS['4']} size="0.95rem" red={false} />
    </div>
  );
}