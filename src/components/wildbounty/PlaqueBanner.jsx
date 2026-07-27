import React from 'react';

// Golden-frame wooden sign banner used as the win message backdrop.
const BANNER_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/49e75976a_file_00000000045482309d8cfa516245238e.png';

export default function PlaqueBanner({ children, className = '', style = {}, glow = false }) {
  return (
    <div
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
    </div>
  );
}