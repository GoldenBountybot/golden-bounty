import React from 'react';
import FadeImage from '@/components/FadeImage';
import GoldenEmblem from '@/components/GoldenEmblem';

// Premium luxury iconic loading screen (Phase 2) — shown after the cinematic
// splash while the app preloads assets and auth. Ultra-luxe casino-brand
// visual language: rotating sunburst rays, quad-ring gold emblem with reeded
// coin edge + 12 studs, glowing "GOLDEN BOUNTY" wordmark with shimmer sweep,
// ornamental corner flourishes, floating gold particles, and an elegant
// progress bar with a glowing leading dot. Pure loading indicator.

const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png';

export default function AppLoadingScreen({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

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

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0805 0%, #1a1208 50%, #0a0805 100%)' }}
    >
      {/* Splash background image — dim, fades in when ready */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }}>
        <FadeImage
          src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8c7eb4bd_golden_bounty_fullscreen_vertical.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          durationMs={600}
        />
      </div>

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

      {/* Floating gold particles */}
      {particles}

      {/* ===== Quad-ring gold emblem with reeded coin medallion ===== */}
      <GoldenEmblem className="mb-10 lg:scale-110" />

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
          className="text-xl lg:text-2xl font-black whitespace-nowrap relative"
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
      <div className="relative w-[280px] sm:w-[320px] lg:w-[400px]">
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
      <div className="relative flex justify-between mt-2 w-[280px] sm:w-[320px] lg:w-[400px]">
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