import React, { useState, useRef, useEffect } from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8c7eb4bd_golden_bounty_fullscreen_vertical.png';

// Full-screen premium splash image (Phase 1). Ken Burns slow zoom + diagonal
// gold light sweep + vignette + bottom gradient fade. No UI — pure cinematic
// brand splash shown before the loading screen.
export default function AppLoadingImage() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

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
          transition: 'opacity 600ms ease',
          animation: loaded ? 'appSplashZoom 8s ease-out forwards' : 'none',
        }}
      />

      {/* Diagonal gold light sweep — one pass for a cinematic reveal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,220,130,0.18) 50%, transparent 65%)',
          animation: 'appLightSweep 2.8s ease-in-out 0.3s 1 both',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Bottom gradient fade into the loading screen */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '40%', background: 'linear-gradient(to bottom, transparent, #0a0805)' }} />
    </div>
  );
}