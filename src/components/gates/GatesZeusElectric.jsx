import React from 'react';

// Electricity clinging to Zeus's body. Uses an SVG edge-detection filter
// (dilate − erode = outline) on the Zeus image itself, so the electric arcs
// trace the body's actual silhouette and internal contours instead of
// floating randomly. Two stacked layers (wide blue halo + thin white core)
// flicker at different rates for a living crackle. mix-blend-mode: screen
// keys out the black background so only the body's edges glow.
const ZEUS_URL = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/84fd16eb6_file_00000000e474820ba9fd196f5f5c9f06.png';

export default function GatesZeusElectric() {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', clipPath: 'inset(0 0 6px 0)' }}
    >
      <defs>
        {/* Wide blue halo edge */}
        <filter id="zeusEdgeWide" x="-12%" y="-12%" width="124%" height="124%">
          <feMorphology operator="dilate" radius="2.2" in="SourceGraphic" result="dil" />
          <feMorphology operator="erode" radius="2.2" in="SourceGraphic" result="ero" />
          <feComposite operator="out" in="dil" in2="ero" result="edge" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 0.30  0 0 0 0 0.62  0 0 0 0 1  0 0 0 1.4 0"
            in="edge" result="blue" />
          <feGaussianBlur stdDeviation="1.6" in="blue" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="blue" />
          </feMerge>
        </filter>
        {/* Thin white core edge */}
        <filter id="zeusEdgeCore" x="-12%" y="-12%" width="124%" height="124%">
          <feMorphology operator="dilate" radius="1" in="SourceGraphic" result="dil" />
          <feMorphology operator="erode" radius="1" in="SourceGraphic" result="ero" />
          <feComposite operator="out" in="dil" in2="ero" result="edge" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 0.9  0 0 0 0 0.96  0 0 0 0 1  0 0 0 1.6 0"
            in="edge" result="white" />
        </filter>
      </defs>

      {/* Wide blue halo — slower flicker */}
      <image href={ZEUS_URL} x="0" y="0" width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet"
        filter="url(#zeusEdgeWide)"
        style={{
          mixBlendMode: 'screen',
          animation: 'zeusEdgeFlicker 0.32s steps(2, jump-none) infinite',
          willChange: 'opacity',
        }} />

      {/* Thin white core — faster flicker, offset */}
      <image href={ZEUS_URL} x="0" y="0" width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet"
        filter="url(#zeusEdgeCore)"
        style={{
          mixBlendMode: 'screen',
          animation: 'zeusEdgeFlicker 0.21s steps(2, jump-none) infinite',
          animationDelay: '0.08s',
          willChange: 'opacity',
        }} />
    </svg>
  );
}