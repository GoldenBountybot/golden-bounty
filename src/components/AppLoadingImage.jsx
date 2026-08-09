import React, { useState, useRef, useEffect } from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8c7eb4bd_golden_bounty_fullscreen_vertical.png';

// Full-screen premium luxury splash (Phase 1). Cinematic Ken Burns zoom,
// dual gold light sweeps, center radial glow pulse, gold dust particles,
// vignette, and bottom gradient fade. No UI — pure cinematic brand reveal.
export default function AppLoadingImage() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  // 8 gold dust particles drifting upward
  const dust = Array.from({ length: 8 }, (_, i) => (
    <div
      key={i}
      className="absolute pointer-events-none"
      style={{
        left: `${10 + i * 11}%`,
        bottom: `${10 + (i % 4) * 8}%`,
        width: `${2 + (i % 3)}px`,
        height: `${2 + (i % 3)}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,235,150,0.9), rgba(255,200,80,0.1))',
        animation: `appParticle ${4 + (i % 3)}s ease-in ${i * 0.5}s infinite`,
      }}
    />
  ));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Splash image with slow Ken Burns zoom */}
      <img
        ref={imgRef}
        src={SPLASH_IMG}
        alt="Golden Bounty"
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 700ms ease',
          animation: loaded ? 'appSplashZoom 9s ease-out forwards' : 'none',
        }}
      />

      {/* Center radial gold glow pulse */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ animation: 'loaderGlow 4s ease-in-out infinite' }}
      >
        <div
          style={{
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,200,80,0.12) 0%, rgba(255,180,60,0.04) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Primary diagonal gold light sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,220,130,0.2) 50%, transparent 65%)',
          animation: 'appLightSweep 3s ease-in-out 0.3s 1 both',
        }}
      />

      {/* Secondary softer sweep — delayed for a double-pass luxury feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(75deg, transparent 40%, rgba(255,240,180,0.12) 50%, transparent 60%)',
          animation: 'appLightSweep 2.5s ease-in-out 1.8s 1 both',
        }}
      />

      {/* Gold dust particles */}
      {dust}

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.6) 100%)' }} />

      {/* Bottom gradient fade into the loading screen */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '45%', background: 'linear-gradient(to bottom, transparent, #0a0805)' }} />
    </div>
  );
}