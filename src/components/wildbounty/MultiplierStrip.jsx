import React from 'react';

// Arc-text multiplier strip overlaid on the BoardTopBanner wooden plaque.
//
// Each individual character of X512, X1024, X2 and X4 is placed on an
// elliptical arc (the banner's sagging U-curve: centre low, ends high) and
// rotated to the arc tangent — true "warp text" instead of whole-word
// rotation. The central X1 stays upright and unchanged.
//
// Coordinate system is normalised: width 300 units, height 100 units
// (matching the banner's ~3:1 aspect), so the ellipse maps to a gentle arc
// in pixels.

const CX = 150;   // arc centre x (width units)
const RX = 116;   // horizontal radius
const CY = 17;    // arc centre y (height units) — sits above the board
const RY = 39;    // vertical radius
const W = 300, H = 100;

const CHAR_W = 0.06;  // angular width per normal character (radians)
const GAP_W   = 0.12;  // small gap between the two words on a side

// Centre angle (radians) for each warped multiplier along the arc.
const CENTERS = {
  '512':  -0.66,
  '1024': -0.30,
  '2':     0.40,
  '4':     0.62,
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
    WebkitTextStroke: '0.4px rgba(70,45,18,0.55)',
    textShadow:
      '0 1px 0 rgba(255,250,220,0.85),' +
      '0 -1px 0 rgba(70,45,18,0.9),' +
      '1px 0 0 rgba(255,245,200,0.45),' +
      '-1px 0 0 rgba(70,45,18,0.45),' +
      '0 2px 2px rgba(0,0,0,0.8),' +
      '0 4px 6px rgba(0,0,0,0.55)',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))',
    whiteSpace: 'nowrap',
    position: 'absolute',
    transformOrigin: 'center center',
    zIndex: 5,
  };
}

// Render a single warped multiplier: each character on the arc at the
// multiplier's centre angle, evenly spaced, rotated to the tangent.
function ArcWord({ label, centerA, size, red, nudgeX = 0, nudgeY = 0, charW = CHAR_W }) {
  const chars = label.split('');
  const n = chars.length;
  const start = centerA - ((n - 1) / 2) * charW;
  return chars.map((ch, i) => {
    const a = start + i * charW;
    const x = CX + RX * Math.sin(a);
    const y = CY + RY * Math.cos(a);
    const leftPct = (x / W) * 100 + nudgeX;
    const topPct = (y / H) * 100 + nudgeY;
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
        {ch === 'X' ? 'X' : ch}
      </span>
    );
  });
}

export default function MultiplierStrip({ className = '' }) {
  const x1Style = {
    ...metallicStyle('1.95rem', false),
    left: '50%',
    top: '56%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Left side, following the left-downward curve */}
      <ArcWord label="X512"  centerA={CENTERS['512']}  size="0.68rem" red={false} nudgeX={-4} nudgeY={3} />
      <ArcWord label="X1024" centerA={CENTERS['1024']} size="0.6rem" red={true} nudgeX={-2} nudgeY={3} charW={0.04} />
      {/* Centre — X1 stays upright and unchanged */}
      <span style={x1Style}>X1</span>
      {/* Right side, following the right-downward curve */}
      <ArcWord label="X2" centerA={CENTERS['2']} size="1.0rem" red={false} />
      <ArcWord label="X4" centerA={CENTERS['4']} size="1.0rem" red={false} />
    </div>
  );
}