import React from 'react';

// Pure-CSS western wooden plaque — no image asset, so there is no white
// background or baked-in rim to leak through. Gold trim is built from inset
// box-shadows; the wood face is a layered gradient. Content sits on a relative
// layer above.

export default function WoodFrame({ variant = 'msg', className = '', style, children }) {
  const pad = variant === 'btn' ? '20px 26px' : '14px 26px';
  const isBtn = variant === 'btn';
  return (
    <div className={`relative ${className}`} style={style}>
      {/* Frame layer — CSS-only wood + gold trim, no white border possible */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          background:
            'linear-gradient(160deg, #4a2e16 0%, #3a2310 35%, #2a190b 70%, #1a0f06 100%)',
          border: '2px solid #c5a059',
          boxShadow: [
            'inset 0 0 0 2px #6b4a1f',      // dark ring
            'inset 0 0 0 4px #c5a059',      // inner gold ring
            'inset 0 0 0 5px #5a3a18',      // dark hairline
            'inset 0 3px 8px rgba(0,0,0,0.65)',
            'inset 0 -2px 6px rgba(0,0,0,0.55)',
            `0 4px 16px rgba(0,0,0,0.55)${isBtn ? ', 0 0 18px rgba(255,200,80,0.35)' : ''}`,
          ].join(', '),
        }}
      />
      {/* Content layer — sits above the frame */}
      <div className="relative" style={{ padding: pad }}>
        {children}
      </div>
    </div>
  );
}