import React from 'react';

// Golden-frame wooden sign banner used as the win message backdrop.
const BANNER_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/49e75976a_file_00000000045482309d8cfa516245238e.png';

export default function PlaqueBanner({ children, className = '', style = {}, glow = false }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        boxShadow: glow
          ? '0 0 12px rgba(255,200,80,0.4), 0 2px 6px rgba(0,0,0,0.55)'
          : '0 2px 6px rgba(0,0,0,0.55)',
        ...style,
      }}
    >
      <img
        src={BANNER_URL}
        alt=""
        className="block w-full h-auto select-none pointer-events-none"
        draggable={false}
        style={{ mixBlendMode: 'screen' }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-[14%]">
        {children}
      </div>
    </div>
  );
}