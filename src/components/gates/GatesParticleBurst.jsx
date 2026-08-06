import React, { useMemo } from 'react';

// Golden particle burst — small dots fly outward and fade when a winning
// symbol shatters. Renders N particles with randomized angles/distances via
// CSS custom properties so each particle gets its own trajectory.
const PARTICLE_COUNT = 14;

export default function GatesParticleBurst({ turbo }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 28 + Math.random() * 34;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 3 + Math.random() * 3.5;
        const delay = Math.random() * 0.04;
        return { dx, dy, size, delay, i };
      }),
    []
  );

  const dur = turbo ? 0.42 : 0.62;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
      {particles.map((p) => (
        <span
          key={p.i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff7c8 0%, #ffd860 45%, rgba(255,180,40,0) 100%)',
            boxShadow: '0 0 5px rgba(255,220,120,0.9)',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            animation: `gatesParticleBurst ${dur}s cubic-bezier(0.18,0.7,0.3,1) ${p.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}