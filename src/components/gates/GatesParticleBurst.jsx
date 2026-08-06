import React, { useMemo } from 'react';

// Bomb-blast explosion — layered effect fired when a winning symbol shatters:
//   1) a bright white-gold radial flash (the detonation flare)
//   2) an expanding golden shockwave ring
//   3) fiery ember chunks flying outward in all directions
//   4) fine golden sparkles trailing the blast
// Each layer uses GPU-only transforms + opacity for smooth, jank-free play.
const EMBER_COUNT = 12;
const SPARK_COUNT = 8;

export default function GatesParticleBurst({ turbo }) {
  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => {
        const angle = (i / EMBER_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const dist = 34 + Math.random() * 40;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 4 + Math.random() * 5;
        const delay = Math.random() * 0.03;
        return { dx, dy, size, delay, i };
      }),
    []
  );

  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => {
        const angle = (i / SPARK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const dist = 22 + Math.random() * 26;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 2.5 + Math.random() * 2.5;
        const delay = Math.random() * 0.05;
        return { dx, dy, size, delay, i };
      }),
    []
  );

  const flashDur = turbo ? 0.32 : 0.5;
  const ringDur = turbo ? 0.42 : 0.62;
  const emberDur = turbo ? 0.5 : 0.72;
  const sparkDur = turbo ? 0.4 : 0.58;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6, contain: 'layout style paint' }}>
      {/* 1 — detonation flash */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '78%',
          height: '78%',
          marginLeft: 0,
          marginTop: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,245,1) 0%, rgba(255,240,180,0.95) 28%, rgba(255,200,80,0.6) 60%, rgba(255,160,30,0) 100%)',
          mixBlendMode: 'screen',
          animation: `gatesBlastFlash ${flashDur}s ease-out forwards`,
          willChange: 'transform, opacity',
        }}
      />
      {/* 2 — shockwave ring */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          border: '3px solid rgba(255,235,140,0.95)',
          boxShadow: '0 0 10px rgba(255,210,90,0.8), inset 0 0 8px rgba(255,240,160,0.7)',
          animation: `gatesBlastRing ${ringDur}s cubic-bezier(0.2,0.7,0.3,1) forwards`,
          willChange: 'transform, opacity',
        }}
      />
      {/* 3 — fiery embers */}
      {embers.map((p) => (
        <span
          key={`e${p.i}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff8e0 0%, #ffd860 35%, #ff8c20 75%, rgba(255,60,0,0) 100%)',
            boxShadow: '0 0 6px rgba(255,180,60,0.95), 0 0 12px rgba(255,120,20,0.6)',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            animation: `gatesBlastEmber ${emberDur}s cubic-bezier(0.15,0.65,0.3,1) ${p.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
      {/* 4 — fine sparkles */}
      {sparks.map((p) => (
        <span
          key={`s${p.i}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff7c8 0%, #ffd860 50%, rgba(255,180,40,0) 100%)',
            boxShadow: '0 0 4px rgba(255,220,120,0.9)',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            animation: `gatesParticleBurst ${sparkDur}s cubic-bezier(0.18,0.7,0.3,1) ${p.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}