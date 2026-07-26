import React from 'react';

// Per-colour glow/tint for the lightning + ×N value text.
const COLORS = {
  green: { glow: 'rgba(120,255,80,0.95)',  stroke: '#9dff5a' },
  blue:  { glow: 'rgba(70,150,255,0.95)',  stroke: '#5fb4ff' },
  pink:  { glow: 'rgba(255,60,180,0.95)',  stroke: '#ff66c4' },
  red:   { glow: 'rgba(255,50,20,1)',       stroke: '#ff4d3d' },
};

// Lightning bolt SVG path (asymmetric classic bolt, bottom → top).
const BOLT_PATH =
  'M13 420 L5 250 L11 240 L7 120 L14 110 L10 0 L18 110 L12 120 L16 240 L13 420 Z';

// Reveal overlay for multiplier (value) symbols.
// Flow: the orb drops in normally (handled by the cell's gatesDrop) → a bolt
// of lightning strikes down onto the cell from the top of the board → the
// ×N value is revealed on the symbol. Persisted (non-fresh) mults just show
// the value statically with no lightning.
export default function GatesMultReveal({ value, color, fresh, turbo }) {
  if (!value || value <= 0) return null;
  const c = COLORS[color] || COLORS.green;
  // Lightning is always electric blue so the strike reads clearly.
  const boltGlow = 'rgba(70,140,255,0.98)';
  const boltStroke = '#2f7dff';
  const boltDur = turbo ? 0.42 : 0.7;
  const revealDelay = turbo ? 0.4 : 0.66;
  const revealDur = turbo ? 0.24 : 0.34;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 14, overflow: 'visible' }}>
      {fresh && (
        <>
          {/* Lightning bolt — extends upward from the cell to the top of the
              board (clipped by the inner reel area's overflow-hidden), so it
              reads as striking down from the banner above the board. */}
          <svg
            style={{
              position: 'absolute', left: '50%', bottom: '52%',
              width: 24, height: 420, transform: 'translateX(-50%)',
              transformOrigin: 'bottom center', pointerEvents: 'none',
              animation: `gatesLightning ${boltDur}s ease-out forwards`,
              filter: `drop-shadow(0 0 6px ${boltGlow}) drop-shadow(0 0 14px ${boltGlow})`,
            }}
            viewBox="0 0 24 420" preserveAspectRatio="none"
          >
            <path d={BOLT_PATH} fill="#e8f2ff" stroke={boltStroke} strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {/* Bright flash on the cell when the bolt lands */}
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: 5,
              background: `radial-gradient(circle at center, ${boltGlow} 0%, rgba(200,225,255,0.4) 45%, transparent 72%)`,
              animation: `gatesLightFlash ${boltDur}s ease-out forwards`,
            }}
          />
        </>
      )}
      {/* ×N value — revealed after the lightning strike */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          animation: fresh
            ? `gatesMultReveal ${revealDur}s cubic-bezier(0.2,1.4,0.4,1) ${revealDelay}s both`
            : 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '18px',
            color: '#fff09a',
            textShadow: '0 0 4px #ffffff, 0 0 10px #ffe566, 0 0 18px #ffd633, 0 0 28px rgba(255,180,0,0.95), 1px 1px 1px rgba(90,50,0,0.95), 0 1px 2px rgba(0,0,0,0.9)',
            letterSpacing: '0.01em', lineHeight: 1, whiteSpace: 'nowrap',
          }}
        >{value}<span style={{ fontSize: '20px' }}>X</span></span>
      </div>
    </div>
  );
}