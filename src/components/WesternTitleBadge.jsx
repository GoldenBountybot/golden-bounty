import React from 'react';

const PLAQUE_BG =
  "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/670fa1a3e_generated_image.png') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))";

// Western gilt-trimmed wooden plaque that frames a page header title text.
export default function WesternTitleBadge({ children, size = 'sm', className = '' }) {
  const pad = size === 'lg' ? 'px-8 py-2.5' : 'px-6 py-2';
  const text = size === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center ${pad} ${text} font-black italic tracking-wide ${className}`}
      style={{
        background: PLAQUE_BG,
        border: '1px solid rgba(190,140,55,0.75)',
        boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)',
        borderRadius: 6,
        color: '#f3e2b3',
        fontFamily: 'Rye, Georgia, serif',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}
    >
      {children}
    </span>
  );
}