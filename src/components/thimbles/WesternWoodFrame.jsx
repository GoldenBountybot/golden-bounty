import React from 'react';

// Premium iconic western wooden frame — wraps any control/banner so the
// frame hugs the element's own width & height. Ornate gold border, wood-grain
// plank, corner studs. Content is clipped so labels never bleed outside.
export default function WesternWoodFrame({ children, className = '', style = {}, contentClassName = '', contentStyle = {}, radius = 12 }) {
  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius, ...style }}>
      {/* Wood plank base */}
      <div className="absolute inset-0" style={{
        borderRadius: radius,
        background: 'linear-gradient(to bottom, #5a4326 0%, #3e2d18 50%, #2a1d0e 100%)',
        boxShadow: 'inset 0 2px 3px rgba(255,220,160,0.2), inset 0 -3px 6px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.6)',
      }} />
      {/* Wood grain texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: radius,
        opacity: 0.3,
        backgroundImage:
          'repeating-linear-gradient(91deg, rgba(50,32,16,0.5) 0px, rgba(120,85,45,0.18) 2px, rgba(50,32,16,0.5) 5px),' +
          'repeating-linear-gradient(180deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
      }} />
      {/* Ornate gold border (layered box-shadows keep rounded corners) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: radius,
        border: '2px solid #c89020',
        boxShadow:
          'inset 0 0 0 1px rgba(50,32,10,0.8),' +
          'inset 0 0 0 4px rgba(255,225,140,0.18),' +
          'inset 0 0 0 5px rgba(110,72,18,0.55),' +
          'inset 0 0 16px rgba(0,0,0,0.5)',
      }} />
      <div className="absolute pointer-events-none" style={{
        inset: 3,
        borderRadius: Math.max(radius - 3, 4),
        border: '1px solid rgba(255,225,140,0.4)',
      }} />
      {/* Corner rivets */}
      {[
        { top: 4, left: 4 },
        { top: 4, right: 4 },
        { bottom: 4, left: 4 },
        { bottom: 4, right: 4 },
      ].map((c, i) => (
        <div key={i} className="absolute w-2.5 h-2.5 rounded-full pointer-events-none" style={{
          ...c,
          background: 'radial-gradient(circle at 35% 35%, #ffe890, #b88010 65%, #5a3a0a)',
          boxShadow: '0 0 4px rgba(255,210,100,0.7), inset 0 0 2px rgba(50,30,8,0.7)',
        }} />
      ))}
      {/* Content — clipped so text never escapes the frame */}
      <div
        className={`relative z-10 overflow-hidden ${contentClassName}`}
        style={{ borderRadius: radius, ...contentStyle }}
      >
        {children}
      </div>
    </div>
  );
}