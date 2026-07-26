import React from 'react';

// Realistic sky-lightning bolt: bright white core → electric-blue channel →
// soft cyan/blue halo, with branching forks, a glowing source point at the top
// and a spiky impact burst at the bottom. Rendered at the machine root so it can
// strike down from the banner above the board onto a multiplier cell.

// Main jagged channel (top → bottom), centered around x = 24.
const MAIN = 'M24 0 L15 65 L31 125 L9 195 L29 265 L14 335 L24 420';
// Forks branching off the main channel (start points sit on MAIN).
const BRANCHES = 'M31 125 L42 162 L45 208 M9 195 L2 240 L4 288 M29 265 L41 308 L43 348';
// Impact shards radiating from the bottom contact point.
const SHARDS =
  'M24 420 L8 410 M24 420 L16 403 M24 420 L24 400 M24 420 L32 403 M24 420 L40 410 M24 420 L6 420 M24 420 L42 420 M24 420 L11 422 M24 420 L37 422';

export default function GatesBolt({ x, y, turbo }) {
  const dur = turbo ? 0.42 : 0.7;
  return (
    <svg
      style={{
        position: 'absolute', left: x, top: 0, width: 48, height: y,
        transform: 'translateX(-50%)', transformOrigin: 'top center',
        pointerEvents: 'none', zIndex: 30, overflow: 'visible',
        animation: `gatesLightning ${dur}s ease-out forwards`,
        filter: 'drop-shadow(0 0 5px rgba(70,140,255,0.85)) drop-shadow(0 0 13px rgba(70,140,255,0.5))',
      }}
      viewBox="0 0 48 420"
      preserveAspectRatio="none"
    >
      {/* soft outer halo */}
      <path d={MAIN} fill="none" stroke="#3b8bff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" style={{ filter: 'blur(3.5px)' }} />
      {/* outer blue channel */}
      <path d={MAIN} fill="none" stroke="#2f7dff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      {/* branches — blue glow then bright edge */}
      <path d={BRANCHES} fill="none" stroke="#3b8bff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" style={{ filter: 'blur(1.2px)' }} />
      <path d={BRANCHES} fill="none" stroke="#4ea9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      {/* bright white core */}
      <path d={MAIN} fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={BRANCHES} fill="none" stroke="#e6f1ff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* top source burst */}
      <circle cx="24" cy="4" r="8" fill="#bcdcff" opacity="0.85" style={{ filter: 'blur(2.5px)' }} />
      <circle cx="24" cy="3" r="3.5" fill="#ffffff" />
      {/* bottom impact burst */}
      <path d={SHARDS} fill="none" stroke="#7fc4ff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" style={{ filter: 'blur(1.2px)' }} />
      <path d={SHARDS} fill="none" stroke="#eaf4ff" strokeWidth="1" strokeLinecap="round" />
      <circle cx="24" cy="418" r="7" fill="#9fd0ff" opacity="0.85" style={{ filter: 'blur(2.5px)' }} />
    </svg>
  );
}