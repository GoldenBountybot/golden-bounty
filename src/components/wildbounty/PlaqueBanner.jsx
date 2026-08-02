import React, { forwardRef } from 'react';

// Golden-frame wooden sign banner used as the win message backdrop.
const BANNER_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ded9f1015_file_00000000d1a0820eb551f775dc672260.png';
const SKULL_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fd2e464cf_file_000000002a3c820b808b197402106ca0.png';
const REVOLVER_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1d7f9ad2f_file_00000000936c81fa8c6b61333fddd167.png';

const PlaqueBanner = forwardRef(function PlaqueBanner({ children, className = '', style = {}, glow = false, showSkull = false }, ref) {
  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={style}
    >
      <img
        src={BANNER_URL}
        alt=""
        className="block w-full h-auto select-none pointer-events-none"
        draggable={false}
        style={{
          mixBlendMode: 'screen',
          filter: 'brightness(1.08) saturate(1.1)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-[14%]">
        {children}
      </div>
      {/* Decorative revolver symbols on both sides of the banner, upside down */}
      <img
        src={REVOLVER_URL}
        alt=""
        className="absolute left-[2%] top-1/2 -translate-y-1/2 w-[13%] max-w-[60px] h-auto select-none pointer-events-none z-20"
        draggable={false}
        style={{ transform: 'translateY(-50%) scaleY(-1)', mixBlendMode: 'screen', filter: 'brightness(1.05) saturate(1.05)' }}
      />
      <img
        src={REVOLVER_URL}
        alt=""
        className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[13%] max-w-[60px] h-auto select-none pointer-events-none z-20"
        draggable={false}
        style={{ transform: 'translateY(-50%) scaleY(-1)', mixBlendMode: 'screen', filter: 'brightness(1.05) saturate(1.05)' }}
      />
      {/* Decorative steer-skull topper — only shown at x8+ multiplier wins */}
      {showSkull && (
        <img
          src={SKULL_URL}
          alt=""
          className="absolute left-1/2 -translate-x-1/2 top-[61px] w-[21%] max-w-[90px] h-auto select-none pointer-events-none z-20"
          draggable={false}
          style={{ mixBlendMode: 'screen', filter: 'brightness(1.05) saturate(1.05)' }}
        />
      )}
    </div>
  );
});

export default PlaqueBanner;