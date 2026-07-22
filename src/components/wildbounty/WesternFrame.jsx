import React from 'react';

// Minimal premium frame — sharp golden border on dark glass.
export default function WesternFrame({ children, className = '', glow = false, variant = 'wood' }) {
  const glass = variant === 'glass';
  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: 7,
        border: '1px solid rgba(214,178,98,0.55)',
        background: glass
          ? 'rgba(20,18,15,0.62)'
          : 'linear-gradient(to bottom, rgba(30,26,20,0.9), rgba(14,12,9,0.92))',
        backdropFilter: glass ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: glass ? 'blur(8px)' : undefined,
        boxShadow: `inset 0 1px 0 rgba(255,240,200,0.16)${
          glow ? ', 0 0 0 1px rgba(214,178,98,0.25), 0 0 18px rgba(214,178,98,0.22)' : ''
        }, 0 4px 14px rgba(0,0,0,0.5)`,
        fontFamily: 'Georgia, serif',
      }}
    >
      {children}
    </div>
  );
}