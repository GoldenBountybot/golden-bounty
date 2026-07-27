import React, { useEffect, useMemo } from 'react';

// Cinematic multiplier orb VFX:
//  1. A luminous golden orb detaches from the banner top-centre and arcs
//     down a curved path to the reel centre.
//  2. On arrival it blooms into a huge pulsing multiplier, throws off
//     rotating light rays, expanding energy rings, a burst of golden
//     embers + fire sparks, and a shower of coins.
//  3. The whole board shakes during the explosion.
//
// All particles are pre-computed once per value so re-renders stay cheap.
export default function FlyingMultiplier({ value, onComplete, slow = 1 }) {
  const FLY = 720 * slow;        // orb travel time
  const EXPLODE = 1500 * slow;   // explosion hold + fade
  const TOTAL = FLY + EXPLODE;
  const RAYS = 12;
  const EMBERS = 18;
  const SPARKS = 10;
  const COINS = 12;

  const rays = useMemo(() => Array.from({ length: RAYS }, (_, i) => i * (360 / RAYS)), []);
  const embers = useMemo(
    () => Array.from({ length: EMBERS }, () => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 130;
      return {
        ex: Math.cos(ang) * dist,
        ey: Math.sin(ang) * dist,
        delay: Math.random() * 120 * slow,
        dur: 700 + Math.random() * 500,
        size: 6 + Math.random() * 8,
      };
    }),
    [slow]
  );
  const sparks = useMemo(
    () => Array.from({ length: SPARKS }, () => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 100;
      return {
        sx: Math.cos(ang) * dist,
        sy: Math.sin(ang) * dist,
        rot: Math.random() * 360,
        delay: Math.random() * 100 * slow,
      };
    }),
    [slow]
  );
  const coins = useMemo(
    () => Array.from({ length: COINS }, (i) => {
      const dx = (i - (COINS - 1) / 2) * 16 + (Math.random() - 0.5) * 18;
      const delay = (i * 30 + Math.random() * 40) * slow;
      const size = 14 + Math.random() * 9;
      return { dx, delay, dur: 600 + Math.random() * 300, size, rot: (Math.random() * 2 - 1) * 220 };
    }),
    [slow]
  );

  useEffect(() => {
    const t = setTimeout(() => onComplete && onComplete(), TOTAL);
    return () => clearTimeout(t);
  }, [onComplete, TOTAL]);

  const flyDur = (FLY / 1000).toFixed(2);
  const explodeDur = (EXPLODE / 1000).toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Board camera shake during the explosion */}
      <div
        className="absolute inset-0"
        style={{ animation: `boardShake ${(EXPLODE / 1000).toFixed(2)}s ease-out ${flyDur}s 1` }}
      >
        {/* Reel-centre anchor for the explosion */}
        <div className="absolute left-1/2 top-1/2 w-0 h-0">
          {/* Expanding energy shockwave rings (3 staggered) */}
          {[0, 1, 2].map((r) => (
            <span
              key={`ring-${r}`}
              className="absolute rounded-full"
              style={{
                width: '60px',
                height: '60px',
                border: '5px solid rgba(255,215,120,0.9)',
                borderRadius: '50%',
                boxShadow: '0 0 18px rgba(255,200,80,0.9)',
                animation: `orbEnergyRing ${explodeDur}s ease-out ${flyDur + r * 0.12}s 1 forwards`,
              }}
            />
          ))}

          {/* Rotating radial light rays */}
          {rays.map((rot, i) => (
            <span
              key={`ray-${i}`}
              className="absolute"
              style={{
                width: '240px',
                height: '8px',
                left: 0,
                top: 0,
                transformOrigin: 'center',
                transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                background:
                  'linear-gradient(90deg, rgba(255,240,160,0) 0%, rgba(255,225,110,0.85) 50%, rgba(255,200,60,0) 100%)',
                filter: 'blur(2px)',
                animation: `orbRays ${explodeDur}s ease-out ${flyDur}s 1 forwards`,
              }}
            />
          ))}

          {/* Big pulsing central multiplier */}
          <span
            className="absolute font-black italic leading-none select-none"
            style={{
              left: 0,
              top: 0,
              fontSize: '7rem',
              fontFamily: 'Rye, Georgia, serif',
              backgroundImage:
                'linear-gradient(180deg,#fff7c4 0%,#ffe990 24%,#f0c850 50%,#b8860b 76%,#5e3d12 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextStroke: '2.5px #3a2407',
              animation: `bigMultPulse ${explodeDur}s ease-out ${flyDur}s 1 forwards`,
            }}
          >
            X{value}
          </span>

          {/* Golden ember burst */}
          {embers.map((e, i) => (
            <span
              key={`ember-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${e.size}px`,
                height: `${e.size}px`,
                marginLeft: `-${e.size / 2}px`,
                marginTop: `-${e.size / 2}px`,
                ['--ex']: `${e.ex}px`,
                ['--ey']: `${e.ey}px`,
                background:
                  'radial-gradient(circle at 35% 30%, #fff5c0 0%, #ffd966 30%, #ff9b21 60%, #c25508 100%)',
                boxShadow: '0 0 8px rgba(255,160,40,0.95)',
                animation: `orbEmber ${(e.dur / 1000).toFixed(2)}s ease-out ${flyDur + (e.delay / 1000).toFixed(2)}s 1 forwards`,
              }}
            />
          ))}

          {/* Fire spark streaks */}
          {sparks.map((s, i) => (
            <span
              key={`spark-${i}`}
              className="absolute"
              style={{
                width: '4px',
                height: '22px',
                marginLeft: '-2px',
                marginTop: '-11px',
                ['--sx']: `${s.sx}px`,
                ['--sy']: `${s.sy}px`,
                ['--rot']: `${s.rot}deg`,
                background:
                  'linear-gradient(180deg, rgba(255,255,220,0) 0%, rgba(255,220,120,1) 40%, rgba(255,140,30,1) 100%)',
                filter: 'blur(1px) drop-shadow(0 0 4px rgba(255,180,40,0.9))',
                animation: `orbSpark ${((500 + s.delay) / 1000).toFixed(2)}s ease-out ${flyDur + (s.delay / 1000).toFixed(2)}s 1 forwards`,
              }}
            />
          ))}
        </div>

        {/* Phase 1 — the golden orb arcs down from the banner to the centre */}
        <div
          className="absolute left-1/2 top-0"
          style={{ animation: `orbArcFly ${flyDur}s cubic-bezier(0.4,0.0,0.3,1) forwards` }}
        >
          <div
            className="rounded-full"
            style={{
              width: '46px',
              height: '46px',
              marginLeft: '-23px',
              marginTop: '-23px',
              background:
                'radial-gradient(circle at 38% 32%, #ffffff 0%, #fff3a8 18%, #ffd966 38%, #d4af37 60%, #9b6a1f 82%, #5e3d12 100%)',
              boxShadow:
                '0 0 16px rgba(255,210,90,1), 0 0 34px rgba(255,180,40,0.8), inset 0 0 10px rgba(255,245,200,0.8)',
              border: '2px solid #7a4f17',
            }}
          />
        </div>

        {/* Phase 3 — coin shower pours from the centre into the win banner */}
        <div className="absolute left-1/2 top-1/2">
          {coins.map((c, i) => (
            <span
              key={`coin-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${c.size}px`,
                height: `${c.size}px`,
                marginLeft: `-${c.size / 2}px`,
                ['--dx']: `${c.dx}px`,
                background:
                  'radial-gradient(circle at 35% 30%, #fff5c0 0%, #ffd966 26%, #d4af37 52%, #9b6a1f 78%, #6e4a14 100%)',
                boxShadow: '0 0 6px rgba(255,200,60,0.85), inset 0 0 2px rgba(90,55,10,0.7)',
                border: '1.5px solid #7a4f17',
                animation: `coinStream ${(c.dur / 1000).toFixed(2)}s cubic-bezier(0.4,0.0,0.7,1) ${flyDur + (c.delay / 1000).toFixed(2)}s forwards`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}