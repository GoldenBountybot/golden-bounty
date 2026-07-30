import React from 'react';

// Premium iconic Western wooden frame — wraps a button/banner so the frame
// matches the wrapped element's size (width + height). Ornate engraved wood
// with golden bevel border, corner rivets and an inner shadow line.
// `full` stretches the frame to 100% width (for bet bar / spin / multiplier
// banner); otherwise it shrinks to the content (for the history button).
export default function WesternWoodFrame({ children, full = false, className = '' }) {
  return (
    <div
      className={`relative ${full ? 'w-full' : 'inline-flex'} ${className}`}
      style={{
        padding: 6,
        borderRadius: 14,
        background:
          'linear-gradient(to bottom, #5a4332 0%, #3a2a1c 40%, #2a1d12 100%)',
        border: '2px solid transparent',
        borderImage:
          'linear-gradient(135deg, #b88010 0%, #ffe890 25%, #8a5a14 50%, #ffe890 75%, #b88010 100%) 1',
        boxShadow:
          'inset 0 0 0 2px rgba(40,26,8,0.85), inset 0 2px 6px rgba(255,220,150,0.12), inset 0 -3px 8px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.55), 0 0 10px rgba(180,130,50,0.25)',
      }}
    >
      {/* Inner engraved line */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: 4, borderRadius: 9, border: '1px solid rgba(255,225,140,0.28)', boxShadow: 'inset 0 0 0 2px rgba(30,20,6,0.5)' }}
      />
      {/* Corner rivets */}
      {[
        { top: 3, left: 3 },
        { top: 3, right: 3 },
        { bottom: 3, left: 3 },
        { bottom: 3, right: 3 },
      ].map((c, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            ...c,
            background: 'radial-gradient(circle at 35% 30%, #ffe890, #a87018 70%, #5a3a0c)',
            boxShadow: '0 0 4px rgba(255,210,100,0.7), inset 0 0 2px rgba(60,40,10,0.8)',
          }}
        />
      ))}
      {/* Content — sits above the inner line / rivets */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}