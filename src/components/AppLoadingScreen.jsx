import React from 'react';

// Premium iconic loading screen (Phase 2) — shown after the cinematic splash
// while the app preloads assets and auth. Luxe casino-brand visual language:
// rotating sunburst rays, triple-ring gold emblem with coin medallion,
// "GOLDEN BOUNTY" wordmark in Cinzel gold gradient, elegant shimmer progress
// bar. Pure loading indicator — no buttons, no navigation.

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
        style={{
          transform: `rotate(${angle}deg) translateY(-62px)`,
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff3c4, #d4a843)',
            boxShadow: '0 0 4px rgba(255,210,100,0.8)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    );
  });

  // 3 floating gold particles for ambient sparkle
  const particles = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className="absolute pointer-events-none"
      style={{
        left: `${15 + i * 13}%`,
        bottom: '18%',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,230,150,0.9), rgba(255,200,80,0.2))',
        animation: `appParticle ${3 + (i % 3)}s ease-in ${i * 0.4}s infinite`,
      }}
    />
  ));

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
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.28,
        }}
      />

      {/* Rotating sunburst light rays behind the emblem */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,200,80,0.06) 8deg, transparent 16deg, transparent 30deg, rgba(255,200,80,0.06) 38deg, transparent 46deg, transparent 60deg, rgba(255,200,80,0.06) 68deg, transparent 76deg, transparent 90deg, rgba(255,200,80,0.06) 98deg, transparent 106deg, transparent 120deg, rgba(255,200,80,0.06) 128deg, transparent 136deg, transparent 150deg, rgba(255,200,80,0.06) 158deg, transparent 166deg, transparent 180deg, rgba(255,200,80,0.06) 188deg, transparent 196deg, transparent 210deg, rgba(255,200,80,0.06) 218deg, transparent 226deg, transparent 240deg, rgba(255,200,80,0.06) 248deg, transparent 256deg, transparent 270deg, rgba(255,200,80,0.06) 278deg, transparent 286deg, transparent 300deg, rgba(255,200,80,0.06) 308deg, transparent 316deg, transparent 330deg, rgba(255,200,80,0.06) 338deg, transparent 346deg)`,
          borderRadius: '50%',
          animation: 'appRayRotate 40s linear infinite',
        }}
      />

      {/* Pulsing center radial gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,80,0.12) 0%, rgba(255,180,60,0.04) 40%, transparent 70%)',
          animation: 'loaderGlow 3s ease-in-out infinite',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Floating gold particles */}
      {particles}

      {/* ===== Triple-ring gold emblem with coin medallion ===== */}
      <div className="relative mb-10" style={{ width: '140px', height: '140px' }}>
        {/* Outer ring — slow spin with gold studs */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            border: '2px solid rgba(214,178,98,0.5)',
            boxShadow: '0 0 24px rgba(255,200,80,0.35), inset 0 0 12px rgba(255,200,80,0.1)',
            animation: 'appRingOuter 12s linear infinite',
          }}
        >
          {studs}
        </div>

        {/* Middle ring — counter spin, dashed gold */}
        <div
          className="absolute inset-[12px]"
          style={{
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,215,120,0.55)',
            animation: 'appRingMid 8s linear infinite',
          }}
        />

        {/* Inner ring — fast spin, solid gold arc */}
        <div
          className="absolute inset-[22px] rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'rgba(255,235,150,0.95)',
            borderRightColor: 'rgba(255,215,0,0.4)',
            boxShadow: '0 0 16px rgba(255,200,80,0.4)',
            animation: 'appRingInner 4s linear infinite',
          }}
        />

        {/* Coin medallion with logo — center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '72px',
              height: '72px',
              border: '2.5px solid rgba(214,178,98,0.95)',
              background: 'radial-gradient(circle, rgba(40,28,14,0.98), rgba(14,10,6,1))',
              animation: 'appCoinGlow 2.2s ease-in-out infinite, appEmblemBreath 3s ease-in-out infinite',
            }}
          >
            <img
              src={LOGO_URL}
              alt="Golden Bounty"
              className="rounded-full object-cover"
              style={{ width: '52px', height: '52px', boxShadow: '0 0 8px rgba(255,200,80,0.5)' }}
            />
          </div>
        </div>
      </div>

      {/* ===== GOLDEN BOUNTY wordmark ===== */}
      <div
        className="flex items-center gap-3 mb-1.5"
        style={{ animation: 'appWordRise 900ms ease-out 200ms both' }}
      >
        {/* Left diamond + line */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(to right, transparent, rgba(190,140,55,0.9))' }} />
          <div style={{ width: '7px', height: '7px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #fff3c4, #b8860b)', boxShadow: '0 0 6px rgba(255,200,80,0.7)' }} />
        </div>
        <p
          className="text-lg font-black whitespace-nowrap"
          style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontWeight: 800,
            letterSpacing: '0.28em',
            background: 'linear-gradient(to bottom, #fff8d4 0%, #ffd75a 35%, #d4a843 65%, #8b6914 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(255,200,80,0.5))',
          }}
        >
          GOLDEN BOUNTY
        </p>
        {/* Right diamond + line */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: '7px', height: '7px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #fff3c4, #b8860b)', boxShadow: '0 0 6px rgba(255,200,80,0.7)' }} />
          <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(to left, transparent, rgba(190,140,55,0.9))' }} />
        </div>
      </div>

      {/* Tagline */}
      <p
        className="text-[10px] tracking-[0.45em] uppercase mb-8"
        style={{
          fontFamily: 'Cinzel, Georgia, serif',
          color: 'rgba(255,220,150,0.7)',
          animation: 'appTaglineFade 800ms ease-out 700ms both',
        }}
      >
        Premium Gaming
      </p>

      {/* ===== Elegant progress bar ===== */}
      <div
        className="relative w-80 h-[3px] rounded-full overflow-hidden"
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

      {/* Percentage */}
      <p
        className="mt-4 text-[11px] tracking-[0.35em] uppercase tabular-nums"
        style={{ color: 'rgba(255,220,150,0.6)', fontFamily: 'Cinzel, Georgia, serif' }}
      >
        {pct}% Loading
      </p>
    </div>
  );
}