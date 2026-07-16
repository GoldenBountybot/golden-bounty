import React from 'react';

// Premium western-style gold frame for text & sections.
export default function WesternFrame({ children, className = '', glow = false }) {
  return (
    <div
      className={`relative rounded-md ${className}`}
      style={{
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