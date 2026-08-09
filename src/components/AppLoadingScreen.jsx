import React from 'react';

// Premium luxury iconic loading screen (Phase 2) — shown after the cinematic
// splash while the app preloads assets and auth. Ultra-luxe casino-brand
// visual language: rotating sunburst rays, quad-ring gold emblem with reeded
// coin edge + 12 studs, glowing "GOLDEN BOUNTY" wordmark with shimmer sweep,
// ornamental corner flourishes, floating gold particles, and an elegant
// progress bar with a glowing leading dot. Pure loading indicator.

const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

export default function AppLoadingScreen({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  // 12 gold studs evenly placed on the outer ring
  const studs = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    return (
      <div
        key={i}
        className="absolute left-1/2 top-1/2"
        style={{ transform: `rotate(${angle}deg) translateY(-72px)` }}
      >
        <div
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff3c4, #d4a843)',
            boxShadow: '0 0 5px rgba(255,210,100,0.85)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    );
  });

  // 24 reeded-edge ridges around the coin medallion
  const ridges = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * 360;
    return (
      <div
        key={i}
        className="absolute left-1/2 top-1/2"
        style={{ transform: `rotate(${angle}deg) translateY(-44px)` }}
      >
        <div
          style={{
            width: '1.5px', height: '6px',
            background: 'rgba(214,178,98,0.6)',
            borderRadius: '1px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    );
  });

  // 8 floating gold particles for ambient sparkle
  const particles = Array.from({ length: 8 }, (_, i) => (
    <div
      key={i}
      className="absolute pointer-events-none"
      style={{
        left: `${12 + i * 10}%`,
        bottom: '16%',
        width: `${3 + (i % 3)}px`,
        height: `${3 + (i % 3)}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,235,150,0.9), rgba(255,200,80,0.15))',
        animation: `appParticle ${3.5 + (i % 4)}s ease-in ${i * 0.45}s infinite`,
      }}
    />
  ));

  // 4 ornamental corner flourishes
  const CornerFlourish = ({ position }) => (
    <div className={`absolute pointer-events-none ${position}`} style={{ animation: 'appCornerGlow 3s ease-in-out infinite' }}>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path d="M2 2 L2 22 M2 2 L22 2" stroke="rgba(214,178,98,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 2 L14 14" stroke="rgba(255,215,120,0.5)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="2" cy="2" r="3" fill="url(#cornerGold)" />
        <defs>
          <linearGradient id="cornerGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0805 0%, #1a1208 50%, #0a0805 100%)' }}
    >
      {/* Splash background image — dim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b1a2d7d3e_file_000000009ef4820baac5161c2e45158b.png)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          opacity: 0.22,
        }}
      />

      {/* Rotating sunburst light rays behind the emblem */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '680px', height: '680px', borderRadius: '50%',
          background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,200,80,0.07) 7deg, transparent 14deg, transparent 28deg, rgba(255,200,80,0.07) 35deg, transparent 42deg, transparent 56deg, rgba(255,200,80,0.07) 63deg, transparent 70deg, transparent 84deg, rgba(255,200,80,0.07) 91deg, transparent 98deg, transparent 112deg, rgba(255,200,80,0.07) 119deg, transparent 126deg, transparent 140deg, rgba(255,200,80,0.07) 147deg, transparent 154deg, transparent 168deg, rgba(255,200,80,0.07) 175deg, transparent 182deg, transparent 196deg, rgba(255,200,80,0.07) 203deg, transparent 210deg, transparent 224deg, rgba(255,200,80,0.07) 231deg, transparent 238deg, transparent 252deg, rgba(255,200,80,0.07) 259deg, transparent 266deg, transparent 280deg, rgba(255,200,80,0.07) 287deg, transparent 294deg, transparent 308deg, rgba(255,200,80,0.07) 315deg, transparent 322deg, transparent 336deg, rgba(255,200,80,0.07) 343deg, transparent 350deg)`,
          animation: 'appRayRotate 45s linear infinite',
        }}
      />

      {/* Pulsing center radial gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,80,0.14) 0%, rgba(255,180,60,0.04) 40%, transparent 70%)',
          animation: 'loaderGlow 3s ease-in-out infinite',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.72) 100%)' }} />

      {/* Ornamental corner flourishes */}
      <CornerFlourish position="top-4 left-4" />
      <CornerFlourish position="top-4 right-4" />
      <CornerFlourish position="bottom-4 left-4" />
      <CornerFlourish position="bottom-4 right-4" />

      {/* Floating gold particles */}
      {particles}

      {/* ===== Quad-ring gold emblem with reeded coin medallion ===== */}
      <div
        className="relative mb-10"
        style={{ width: '160px', height: '160px', animation: 'appEmblemFloat 4s ease-in-out infinite' }}
      >
        {/* Outer ring — slow spin with 12 gold studs */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            border: '2px solid rgba(214,178,98,0.5)',
            boxShadow: '0 0 28px rgba(255,200,80,0.35), inset 0 0 14px rgba(255,200,80,0.1)',
            animation: 'appRingOuter 14s linear infinite',
          }}
        >
          {studs}
        </div>

        {/* Second ring — ornamental dots, counter spin */}
        <div
          className="absolute inset-[8px]"
          style={{ borderRadius: '50%', animation: 'appRingMid 10s linear infinite' }}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * 360;
            return (
              <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg) translateY(-68px)` }}>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,215,120,0.7)', transform: 'translate(-50%, -50%)' }} />
              </div>
            );
          })}
        </div>

        {/* Third ring — dashed gold, forward spin */}
        <div
          className="absolute inset-[18px]"
          style={{
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,215,120,0.55)',
            animation: 'appRingInner 6s linear infinite',
          }}
        />

        {/* Fourth ring — solid gold arc, fast counter spin */}
        <div
          className="absolute inset-[28px] rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'rgba(255,235,150,0.95)',
            borderLeftColor: 'rgba(255,215,0,0.4)',
            boxShadow: '0 0 16px rgba(255,200,80,0.4)',
            animation: 'appRingMid 4s linear infinite',
          }}
        />

        {/* Reeded coin edge — rotating ridged ring */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: 'appCoinEdge 20s linear infinite' }}
        >
          <div className="relative" style={{ width: '96px', height: '96px' }}>
            {ridges}
          </div>
        </div>

        {/* Coin medallion with logo — center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '80px', height: '80px',
              border: '3px solid rgba(214,178,98,0.95)',
              background: 'radial-gradient(circle, rgba(40,28,14,0.98), rgba(14,10,6,1))',
              animation: 'appCoinGlow 2.2s ease-in-out infinite, appEmblemBreath 3s ease-in-out infinite',
            }}
          >
            <img
              src={LOGO_URL}
              alt="Golden Bounty"
              className="rounded-full object-cover"
              style={{ width: '56px', height: '56px', boxShadow: '0 0 8px rgba(255,200,80,0.5)' }}
            />
          </div>
        </div>
      </div>

      {/* ===== Radial gold burst behind wordmark ===== */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '340px', height: '60px',
          background: 'radial-gradient(ellipse, rgba(255,200,80,0.18) 0%, transparent 70%)',
          animation: 'appRadialBurst 3s ease-in-out infinite',
          marginTop: '-20px',
        }}
      />

      {/* ===== GOLDEN BOUNTY wordmark with shimmer ===== */}
      <div
        className="flex items-center gap-3 mb-2 relative"
        style={{ animation: 'appWordRise 900ms ease-out 200ms both' }}
      >
        {/* Left diamond + line */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: '36px', height: '1.5px', background: 'linear-gradient(to right, transparent, rgba(190,140,55,0.9))' }} />
          <div style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #fff3c4, #b8860b)', boxShadow: '0 0 7px rgba(255,200,80,0.75)' }} />
        </div>
        <p
          className="text-xl font-black whitespace-nowrap relative"
          style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontWeight: 800,
            letterSpacing: '0.28em',
            background: 'linear-gradient(110deg, #d4a843 0%, #fff8d4 25%, #ffd75a 50%, #fff8d4 75%, #d4a843 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,200,80,0.55))',
            animation: 'appWordShimmer 4s linear infinite',
          }}
        >
          GOLDEN BOUNTY
        </p>
        {/* Right diamond + line */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #fff3c4, #b8860b)', boxShadow: '0 0 7px rgba(255,200,80,0.75)' }} />
          <div style={{ width: '36px', height: '1.5px', background: 'linear-gradient(to left, transparent, rgba(190,140,55,0.9))' }} />
        </div>
      </div>

      {/* Tagline */}
      <p
        className="text-[10px] tracking-[0.5em] uppercase mb-9"
        style={{
          fontFamily: 'Cinzel, Georgia, serif',
          color: 'rgba(255,220,150,0.7)',
          animation: 'appTaglineFade 800ms ease-out 700ms both',
        }}
      >
        ✦ Premium Gaming ✦
      </p>

      {/* ===== Elegant progress bar with glowing leading dot ===== */}
      <div className="relative" style={{ width: '320px' }}>
        <div
          className="relative w-full h-[3px] rounded-full overflow-hidden"
          style={{
            background: 'rgba(20,14,7,0.95)',
            border: '1px solid rgba(190,140,55,0.55)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
            animation: 'appBarGlow 2s ease-in-out infinite',
          }}
        >
          <div
            className="h-full rounded-full relative overflow-hidden transition-[width] duration-200"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to right, #b8860b 0%, #ffd75a 50%, #fff3c4 100%)',
              boxShadow: '0 0 10px rgba(255,210,100,0.7)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                animation: 'loaderShimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
        {/* Glowing leading dot at the progress edge */}
        {pct > 0 && pct < 100 && (
          <div
            className="absolute top-1/2 rounded-full pointer-events-none"
            style={{
              left: `calc(${pct}% - 4px)`,
              width: '8px', height: '8px',
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle, #fff8d4, #ffd75a)',
              animation: 'appBarDot 1s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Tick marks under the bar */}
      <div className="relative flex justify-between mt-2" style={{ width: '320px' }}>
        {[0, 25, 50, 75, 100].map((t) => (
          <div key={t} style={{ width: '1px', height: '5px', background: 'rgba(190,140,55,0.4)' }} />
        ))}
      </div>

      {/* Percentage */}
      <p
        className="mt-3 text-[11px] tracking-[0.35em] uppercase tabular-nums"
        style={{ color: 'rgba(255,220,150,0.6)', fontFamily: 'Cinzel, Georgia, serif' }}
      >
        {pct}% Loading
      </p>
    </div>
  );
}