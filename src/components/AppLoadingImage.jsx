import React, { useState, useRef, useEffect } from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e500ea5e4_Screenshot_20260808-201731.png';

// Full-screen splash shown while the app boots. Displays the wood-carved
// Golden Bounty emblem centered on a dark background with a loading
// spinner beneath it.
export default function AppLoadingImage() {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);

  // Cached image may already be complete before React attaches onLoad —
  // check img.complete on mount so the splash shows instantly.
  useEffect(() => {
    if (imgRef.current?.complete) setImgLoaded(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Subtle golden radial glow behind the emblem */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(55% 45% at 50% 45%, rgba(212,175,55,0.14), transparent 65%)' }} />

      {/* Wood-carved emblem — full-screen centered */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{ animation: 'splashEmblemRise 700ms cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <img
          ref={imgRef}
          src={SPLASH_IMG}
          alt="Golden Bounty"
          className="select-none"
          draggable={false}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            maxWidth: '86vw',
            maxHeight: '70vh',
            width: 'auto',
            height: 'auto',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 500ms ease',
            filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))',
            animation: imgLoaded ? 'splashLogoBreath 3.4s ease-in-out infinite' : 'none',
          }}
        />

        {/* Loading spinner */}
        <div className="flex items-center gap-2.5 mt-8" style={{ animation: 'splashFadeIn 800ms 300ms ease both' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 7, height: 7,
                background: '#D4AF37',
                boxShadow: '0 0 8px rgba(212,175,55,0.85)',
                animation: `splashDot 1.2s ${i * 0.18}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom hairline + tagline */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-10" style={{ animation: 'splashFadeIn 900ms 500ms ease both' }}>
        <div className="h-px w-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)' }} />
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,235,170,0.5)' }}>
          24/7 Support · 18+ Only
        </span>
      </div>
    </div>
  );
}