import React from 'react';

// Continuous electric arcs flowing across Zeus's body. Rendered as an SVG
// overlay with several jagged lightning paths whose stroke-dashoffset and
// opacity animate on infinite loops, so electricity always crackles over
// the whole figure. Pointer-events disabled so it never blocks interaction.
export default function GatesZeusElectric() {
  // A few jagged arcs tracing down/across the body. Coordinates are in a
  // 100×120 viewBox mapped over the Zeus image area.
  const arcs = [
    'M30 10 L36 30 L24 50 L38 70 L26 90 L34 110',
    'M52 6 L46 26 L58 44 L44 62 L56 82 L46 104',
    'M68 14 L62 34 L74 52 L60 70 L72 92 L64 112',
    'M40 20 L52 38 L38 56 L50 76 L40 96',
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width="100%"
      height="100%"
      viewBox="0 0 100 120"
      preserveAspectRatio="none"
      style={{ mixBlendMode: 'screen', overflow: 'visible' }}
    >
      <defs>
        <filter id="zeusBoltGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {arcs.map((d, i) => (
        <g key={i} filter="url(#zeusBoltGlow)">
          {/* soft outer halo */}
          <path d={d} fill="none" stroke="#5aa8ff" strokeWidth="3.2"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.45"
            style={{
              strokeDasharray: '14 22',
              animation: `zeusArcFlow ${1.1 + i * 0.25}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          {/* bright core */}
          <path d={d} fill="none" stroke="#eaf4ff" strokeWidth="1.1"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
            style={{
              strokeDasharray: '8 26',
              animation: `zeusArcFlow ${0.8 + i * 0.2}s linear infinite`,
              animationDelay: `${i * 0.18}s`,
            }} />
        </g>
      ))}
    </svg>
  );
}