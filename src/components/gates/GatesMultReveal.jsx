import React from 'react';

// Reveal overlay for multiplier (value) symbols.
// The lightning bolt itself is rendered at the machine root (see GatesMachine)
// so it can strike down from the banner above the board without being clipped
// by the reel area's overflow-hidden. Here we only render the on-cell impact
// flash + the ×N value.
const FLASH_GLOW = 'rgba(70,140,255,0.98)';

export default function GatesMultReveal({ value, fresh, turbo }) {
  if (!value || value <= 0) return null;
  const revealDelay = turbo ? 0.4 : 0.66;
  const revealDur = turbo ? 0.24 : 0.34;
  const flashDelay = turbo ? 0.1 : 0.14;
  const flashDur = turbo ? 0.22 : 0.34;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 14, overflow: 'visible' }}>
      {fresh && (
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: 5,
            background: `radial-gradient(circle at center, ${FLASH_GLOW} 0%, rgba(200,225,255,0.4) 45%, transparent 72%)`,
            animation: `gatesLightFlash ${flashDur}s ease-out ${flashDelay}s both`,
          }}
        />
      )}
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