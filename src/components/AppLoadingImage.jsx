import React, { useState, useRef, useEffect } from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8c7eb4bd_golden_bounty_fullscreen_vertical.png';

// Full-screen static splash image shown before the loading screen.
// No UI, no buttons — just the image covering the whole screen.
export default function AppLoadingImage() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Cached images may already be complete before React attaches onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: '#0a0806' }}>
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
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 500ms ease' }}
      />
    </div>
  );
}