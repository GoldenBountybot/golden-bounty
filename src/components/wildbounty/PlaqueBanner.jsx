import React from 'react';

// Wooden curved plaque (web asset) used as a frame/background behind banners.
const PLAQUE_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/88b423add_InShot_20260715_212417291.jpg';

export default function PlaqueBanner({ children, className = '', style = {}, glow = false }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundImage: `url(${PLAQUE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: glow
          ? '0 0 12px rgba(255,200,80,0.4), 0 2px 6px rgba(0,0,0,0.55)'
          : '0 2px 6px rgba(0,0,0,0.55)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}