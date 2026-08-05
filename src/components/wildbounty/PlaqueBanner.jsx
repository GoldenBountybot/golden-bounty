import React, { forwardRef } from 'react';

// Golden-frame wooden sign banner used as the win message backdrop.
const BANNER_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ded9f1015_file_00000000d1a0820eb551f775dc672260.png';
const SKULL_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fd2e464cf_file_000000002a3c820b808b197402106ca0.png';

const PlaqueBanner = forwardRef(function PlaqueBanner({ children, className = '', style = {}, glow = false, glowKey = 0, showSkull = false }, ref) {
  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={style}
    >
      <img
        key={glow ? `glow-${glowKey}` : 'idle'}
        src={BANNER_URL}
        alt=""
        className="block w-full h-auto select-none pointer-events-none"
        draggable={false}
        style={{
          mixBlendMode: 'screen',
          filter: glow
            ? 'brightness(1.25) saturate(1.3) drop-shadow(0 0 10px rgba(255,215,80,0.95)) drop-shadow(0 0 22px rgba(255,190,50,0.7))'
            : 'brightness(1.08) saturate(1.1)',
          animation: glow ? 'wbTotalGlowPulse 1.4s ease-out forwards' : 'none',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-[14%]">
        {children}
      </div>
      {/* Decorative steer-skull topper — only shown at x8+ multiplier wins */}
      {showSkull && (
        <img
          src={SKULL_URL}
          alt=""
          className="absolute left-1/2 -translate-x-1/2 top-[61px] w-[21%] max-w-[90px] h-auto select-none pointer-events-none z-20"
          draggable={false}
          style={{ filter: 'brightness(1.15) contrast(1.12) saturate(1.1) drop-shadow(0 2px 5px rgba(0,0,0,0.85))' }}
        />
      )}
    </div>
  );
});

export default PlaqueBanner;