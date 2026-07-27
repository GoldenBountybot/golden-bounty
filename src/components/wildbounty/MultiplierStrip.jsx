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
  '512':  -0.62,
  '1024': -0.28,
  '2':     0.28,
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
      : 'linear-gradient(180deg,#fff4c0 0%,#f0c850 30%,#d4a73c 55%,#a67b25 80%,#6e4e18 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    WebkitTextStroke: '0.6px rgba(110,78,24,0.85)',
    textShadow:
      '0 1px 0 rgba(255,244,192,0.95),' +
      '0 -1px 0 rgba(90,62,20,0.95),' +
      '1px 0 0 rgba(255,235,160,0.6),' +
      '-1px 0 0 rgba(90,62,20,0.6),' +
      '0 2px 3px rgba(0,0,0,0.85),' +
      '0 4px 7px rgba(0,0,0,0.6)',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6)) brightness(1.08)',
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
    top: '58%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Continuous rotating golden shimmer sweep across the banner */}
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none', maskImage: 'linear-gradient(180deg,transparent 30%,#000 60%,transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg,transparent 30%,#000 60%,transparent 100%)' }}>
        <div
          className="absolute top-1/4 h-1/2"
          style={{
            width: '40%',
            left: '0',
            background: 'linear-gradient(90deg, rgba(255,245,170,0) 0%, rgba(255,240,160,0.85) 50%, rgba(255,225,120,0) 100%)',
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
            animation: 'bannerShimmer 4.2s ease-in-out infinite',
          }}
        />
      </div>
      {/* Left side, following the left-upward curve */}
      <ArcWord label="X512"  centerA={CENTERS['512']}  size="0.72rem" red={false} nudgeY={3} />
      <ArcWord label="X1024" centerA={CENTERS['1024']} size="0.64rem" red={false} charW={0.045} nudgeY={3} />
      {/* Centre — X1 stays upright and unchanged */}
      <span style={x1Style}>X1</span>
      {/* Right side, following the right-upward curve */}
      <ArcWord label="X2" centerA={CENTERS['2']} size="1.0rem" red={false} nudgeY={3} />
      <ArcWord label="X4" centerA={CENTERS['4']} size="1.0rem" red={false} nudgeY={3} />
    </div>
  );
}