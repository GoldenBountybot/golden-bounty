import React from 'react';

// Electric arcs flickering across Zeus's body when symbols match.
// Positioned as an overlay matching the Zeus figure bounds (same right/bottom/
// width as the Zeus <img> in GatesMachine). Only visible while `active`
// (winning symbols present on the board). GPU-friendly: opacity-only flicker.
const ARCS = [
  'M8 16 L16 24 L10 32 L18 40',
  'M28 42 L20 50 L30 56 L24 64',
  'M12 70 L20 76 L14 84 L22 90',
  'M36 26 L44 34 L38 42 L46 48',
  'M18 98 L26 104 L20 112 L28 118',
  'M32 78 L40 84 L34 92',
];

export default function GatesZeusLightning({ active }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none"
      style={{
        position: 'absolute', right: '-10%', bottom: -12,
        width: '58%', maxWidth: 220, aspectRatio: '1 / 1.5',
        zIndex: 25, overflow: 'visible',
      }}>
      <svg viewBox="0 0 54 130" preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible',
          filter: 'drop-shadow(0 0 4px rgba(120,180,255,0.9))' }}>
        {ARCS.map((d, i) => (
          <g key={i}
            style={{ animation: `zeusArc ${(0.26 + (i % 3) * 0.08).toFixed(2)}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite` }}>
            <path d={d} fill="none" stroke="#7fc4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
              style={{ filter: 'blur(1.5px)' }} />
            <path d={d} fill="none" stroke="#eaf4ff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}