import React from 'react';

// Premium western-style gold frame for text & sections.
export default function WesternFrame({ children, className = '', glow = false, variant = 'wood' }) {
  const glass = variant === 'glass';
  return (
    <div
      className={`relative rounded-md ${className}`}
      style={glass ? {
        border: '1px solid rgba(245,210,120,0.5)',
        background: 'linear-gradient(to bottom, rgba(20,14,8,0.28), rgba(12,8,4,0.34))',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        boxShadow: `inset 0 1px 0 rgba(255,230,160,0.35), inset 0 0 0 1px rgba(190,140,55,0.4), ${glow ? '0 0 14px rgba(255,200,80,0.35), ' : ''}0 0 0 1px rgba(120,80,30,0.3), 0 4px 14px rgba(0,0,0,0.45)`,
        fontFamily: 'Rye, Georgia, serif',
      } : {
        border: '1px solid rgba(190,140,55,0.75)',
        background: 'linear-gradient(to bottom, rgba(58,40,18,0.9), rgba(26,18,9,0.92))',
        boxShadow: `inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), ${glow ? '0 0 12px rgba(255,200,80,0.4), ' : ''}0 2px 6px rgba(0,0,0,0.55)`,
        fontFamily: 'Rye, Georgia, serif',
      }}
    >
      {children}
    </div>
  );
}