import React from 'react';

// Big Brown title logo rendered with CSS + inline SVG so there is NO raster
// background box — the dark forest background shows through directly.
// Wooden log plaque + glowing golden cracked letters + antlers + foliage.

const Antlers = ({ side = 'left' }) => {
  const pos = { [side]: '-46px', zIndex: 1 };
  const beam = side === 'left' ? 'M118 70 C 86 60, 60 46, 40 24' : 'M2 70 C 34 60, 60 46, 80 24';
  const t1 = side === 'left' ? 'M92 60 q -10 -16 -22 -20' : 'M28 60 q 10 -16 22 -20';
  const t2 = side === 'left' ? 'M70 52 q -8 -14 -18 -16' : 'M50 52 q 8 -14 18 -16';
  const t3 = side === 'left' ? 'M52 44 q -6 -10 -14 -10' : 'M68 44 q 6 -10 14 -10';
  const t4 = side === 'left' ? 'M40 24 q 2 -10 10 -14' : 'M80 24 q -2 -10 -10 -14';
  const baseX = side === 'left' ? 118 : 2;
  const tipX = side === 'left' ? 40 : 80;
  return (
    <svg
      viewBox="0 0 120 140"
      width="62"
      height="72"
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
      style={pos}
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        fill="none"
        stroke="#d2b48c"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }}
      >
        <path d={beam} strokeWidth="8" />
        <path d={t1} strokeWidth="5" />
        <path d={t2} strokeWidth="5" />
        <path d={t3} strokeWidth="4" />
        <path d={t4} strokeWidth="4" />
      </g>
      <g fill="#d2b48c" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}>
        <circle cx={baseX} cy="70" r="4" />
        <circle cx={tipX} cy="24" r="3" />
      </g>
    </svg>
  );
};

const Leaf = ({ style, rot = 0, scale = 1, color = '#228B22' }) => (
  <svg
    viewBox="0 0 40 40"
    width={28 * scale}
    height={28 * scale}
    className="absolute pointer-events-none"
    style={{ ...style, transform: `rotate(${rot}deg)`, zIndex: 2 }}
  >
    <path
      d="M20 4 C 30 8, 34 20, 24 34 C 22 30, 18 30, 16 34 C 6 20, 10 8, 20 4 Z"
      fill={color}
      stroke="#144a14"
      strokeWidth="1"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
    />
    <path d="M20 6 L 20 32" stroke="#144a14" strokeWidth="1" fill="none" opacity="0.7" />
  </svg>
);

const Pinecone = ({ style }) => (
  <svg
    viewBox="0 0 24 36"
    width="15"
    height="22"
    className="absolute pointer-events-none"
    style={{ ...style, zIndex: 2 }}
  >
    <ellipse cx="12" cy="20" rx="9" ry="15" fill="#6b4a1e" stroke="#3a2408" strokeWidth="1"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
    <g stroke="#3a2408" strokeWidth="1" opacity="0.6">
      <path d="M4 16 L 20 16 M5 22 L 19 22 M7 28 L 17 28 M9 10 L 15 10" />
      <path d="M12 6 L 12 34" />
    </g>
  </svg>
);

const GoldText = ({ children, mt }) => (
  <span
    className="text-[26px] sm:text-[30px] font-black italic tracking-[0.04em]"
    style={{
      marginTop: mt,
      fontFamily: 'Rye, Georgia, serif',
      background: 'linear-gradient(180deg, #FFFACD 0%, #FFD700 28%, #DAA520 58%, #b8860b 80%, #8B5A2B 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      filter: 'drop-shadow(0 2px 0 #3a2408) drop-shadow(0 0 4px rgba(255,215,0,0.7)) drop-shadow(0 0 10px rgba(255,200,80,0.45))',
      WebkitTextStroke: '1.2px #3a2408',
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);

export default function BigBrownTitle() {
  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
      <div
        className="relative rounded-[14px] px-5 py-1.5"
        style={{
          background: 'linear-gradient(180deg, #8B4513 0%, #6b3a14 45%, #5a2f10 70%, #42250c 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,200,140,0.25), inset 0 -3px 6px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.7)',
          border: '2px solid #3a2408',
        }}
      >
        <div
          className="absolute inset-0 rounded-[14px] pointer-events-none opacity-40"
          style={{ background: 'repeating-linear-gradient(180deg, transparent 0 6px, rgba(40,20,8,0.5) 6px 7px)' }}
        />
        <div className="relative flex flex-col items-center leading-none">
          <GoldText>BIG</GoldText>
          <GoldText mt="2px">BROWN</GoldText>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{ left: '58%', top: '52%', width: 14, height: 14, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,250,205,0.6) 40%, transparent 70%)',
            filter: 'blur(1px)', mixBlendMode: 'screen' }}
        />
      </div>

      <Antlers side="left" />
      <Antlers side="right" />

      <Leaf style={{ left: '-30px', bottom: '-10px' }} rot={-20} scale={1.1} color="#228B22" />
      <Leaf style={{ left: '10px', bottom: '-14px' }} rot={30} scale={0.9} color="#2e6b2e" />
      <Leaf style={{ right: '10px', bottom: '-14px' }} rot={-30} scale={0.9} color="#556B2F" />
      <Leaf style={{ right: '-30px', bottom: '-10px' }} rot={20} scale={1.1} color="#228B22" />
      <Pinecone style={{ left: '-18px', bottom: '-18px' }} />
      <Pinecone style={{ right: '-18px', bottom: '-18px' }} />
    </div>
  );
}