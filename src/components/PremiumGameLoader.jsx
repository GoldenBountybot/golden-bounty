import React, { useMemo } from 'react';

// Shared premium loading visual used by all game loading screens.
// Luxe dark-vignette stage with:
//  - animated gold dust particles drifting upward
//  - a pulsing radial gold glow + radial burst behind the wordmark
//  - triple spinning gold rings (outer arc, middle reeded edge, inner dashed)
//    around a breathing gold-framed logo medallion
//  - corner ornamental gold filigree flourishes
//  - a bold gold-gradient shimmering "Made By Golden Bounty" wordmark
//  - a jeweled progress bar with traveling shimmer + glowing leading dot
// Each loading screen keeps its own progress logic and passes the current
// percentage here.

const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

// Fallback backdrop so the loading screen is never a plain black stage when a
// screen doesn't pass its own background image (already preloaded at splash).
const FALLBACK_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png';

// Stable random particle config so it doesn't re-randomize each render.
function useParticles(count) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 4,
    size: 2 + Math.random() * 3,
  })), [count]);
}

// Ornamental corner flourish — mirrored via CSS transform on each corner.
function CornerFlourish({ className, style }) {
  return (
    <div className={`absolute pointer-events-none ${className || ''}`} style={style}>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,80,0.45))' }}>
        <path d="M4 4 L4 36 M4 4 L36 4" stroke="url(#cg)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 14 Q20 14 20 30 Q20 18 36 18" stroke="url(#cg)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="4" cy="4" r="2.5" fill="url(#cg)" />
        <circle cx="20" cy="30" r="1.5" fill="#ffd75a" opacity="0.7" />
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="50%" stopColor="#ffd75a" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function PremiumGameLoader({ progress, title = 'Loading', bgImage }) {
  const particles = useParticles(18);
  const bg = bgImage || FALLBACK_BG;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0805 0%, #1a1208 50%, #0a0805 100%)' }}
    >
      {/* Background photo (falls back to the app backdrop) */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-black/60" />

      {/* Pulsing center radial gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,80,0.12) 0%, rgba(255,180,60,0.05) 40%, transparent 70%)',
          animation: 'loaderGlow 3s ease-in-out infinite',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Gold dust particles drifting upward */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'radial-gradient(circle, #fff3c4 0%, #ffd75a 40%, transparent 80%)',
              animation: `loaderParticle ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Corner ornamental flourishes */}
      <CornerFlourish className="top-3 left-3" style={{ animation: 'loaderCornerGlow 3.5s ease-in-out infinite' }} />
      <CornerFlourish className="top-3 right-3" style={{ transform: 'scaleX(-1)', animation: 'loaderCornerGlow 3.5s ease-in-out 0.4s infinite' }} />
      <CornerFlourish className="bottom-3 left-3" style={{ transform: 'scaleY(-1)', animation: 'loaderCornerGlow 3.5s ease-in-out 0.8s infinite' }} />
      <CornerFlourish className="bottom-3 right-3" style={{ transform: 'scale(-1)', animation: 'loaderCornerGlow 3.5s ease-in-out 1.2s infinite' }} />

      {/* Logo with triple spinning gold rings */}
      <div className="relative mb-7" style={{ width: '128px', height: '128px' }}>
        {/* Outer ring — slow gold arc spin */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            animationDuration: '4s',
            border: '2px solid transparent',
            borderTopColor: 'rgba(255,215,0,0.95)',
            borderRightColor: 'rgba(255,215,0,0.45)',
            boxShadow: '0 0 32px rgba(255,200,80,0.55), inset 0 0 16px rgba(255,200,80,0.14)',
          }}
        />
        {/* Middle ring — reeded coin edge, slow rotation */}
        <div
          className="absolute inset-[6px] rounded-full"
          style={{
            animation: 'loaderCoinEdge 8s linear infinite',
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.25) 5deg, transparent 10deg, rgba(255,215,0,0.25) 15deg, transparent 20deg, rgba(255,215,0,0.25) 25deg, transparent 30deg, rgba(255,215,0,0.25) 35deg, transparent 40deg, rgba(255,215,0,0.25) 45deg, transparent 50deg, rgba(255,215,0,0.25) 55deg, transparent 60deg, rgba(255,215,0,0.25) 65deg, transparent 70deg, rgba(255,215,0,0.25) 75deg, transparent 80deg, rgba(255,215,0,0.25) 85deg, transparent 90deg)',
            mask: 'radial-gradient(circle, transparent 58%, black 60%, black 66%, transparent 68%)',
            WebkitMask: 'radial-gradient(circle, transparent 58%, black 60%, black 66%, transparent 68%)',
          }}
        />
        {/* Inner ring — fast dashed counter-spin */}
        <div
          className="absolute inset-[14px] rounded-full animate-spin"
          style={{
            animationDuration: '2.2s',
            animationDirection: 'reverse',
            border: '1.5px dashed rgba(255,235,150,0.6)',
          }}
        />
        {/* Gold-framed logo medallion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center animate-[saGlowPulse_1.8s_ease-in-out_infinite]"
            style={{
              width: '68px',
              height: '68px',
              border: '2px solid rgba(214,178,98,0.95)',
              boxShadow: '0 0 26px rgba(255,200,80,0.85), inset 0 0 12px rgba(255,210,120,0.35)',
              background: 'radial-gradient(circle, rgba(26,18,9,0.95), rgba(10,8,5,0.98))',
            }}
          >
            <img
              src={LOGO_URL}
              alt="Golden Bounty"
              className="rounded-full object-cover"
              style={{ width: '52px', height: '52px', boxShadow: '0 0 10px rgba(255,200,80,0.6)' }}
            />
          </div>
        </div>
      </div>

      {/* Radial gold burst behind the wordmark */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '80px',
          background: 'radial-gradient(ellipse, rgba(255,200,80,0.18) 0%, transparent 70%)',
          animation: 'loaderRadialBurst 3s ease-in-out infinite',
        }}
      />

      {/* Made By Golden Bounty — bold gold-gradient shimmering wordmark with diamond flourishes */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex items-center gap-1.5">
          <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(to right, transparent, rgba(190,140,55,0.9))' }} />
          <div style={{ width: '6px', height: '6px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #ffd75a, #b8860b)', boxShadow: '0 0 6px rgba(255,200,80,0.7)' }} />
        </div>
        <p
          className="text-sm font-black tracking-[0.32em] uppercase whitespace-nowrap"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(90deg, #b8860b 0%, #ffd75a 25%, #fff8d4 50%, #ffd75a 75%, #b8860b 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'loaderWordShimmer 3s linear infinite',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(255,200,80,0.55))',
          }}
        >
          Made By Golden Bounty
        </p>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '6px', height: '6px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #ffd75a, #b8860b)', boxShadow: '0 0 6px rgba(255,200,80,0.7)' }} />
          <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(to left, transparent, rgba(190,140,55,0.9))' }} />
        </div>
      </div>

      {/* Game title */}
      <h2
        className="text-2xl mb-6 tracking-wide"
        style={{
          fontFamily: 'Rye, Georgia, serif',
          color: '#f0e0b8',
          textShadow: '0 2px 4px rgba(0,0,0,0.85), 0 0 16px rgba(255,200,80,0.4)',
        }}
      >
        {title}
      </h2>

      {/* Elegant progress bar — matches the app loading screen exactly:
          a slim glowing gold hairline with shimmer + leading jewel dot. */}
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
              width: `${progress}%`,
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
        {progress > 0 && progress < 100 && (
          <div
            className="absolute top-1/2 rounded-full pointer-events-none"
            style={{
              left: `calc(${progress}% - 4px)`,
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
        {[0, 25, 50, 75, 100].map((tk) => (
          <div key={tk} style={{ width: '1px', height: '5px', background: 'rgba(190,140,55,0.4)' }} />
        ))}
      </div>

      <p
        className="mt-3 text-[11px] tracking-[0.35em] uppercase tabular-nums"
        style={{ color: 'rgba(255,220,150,0.6)', fontFamily: 'Cinzel, Georgia, serif' }}
      >
        {Math.round(progress)}% Loading
      </p>
    </div>
  );
}