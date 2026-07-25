import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// Exact symbol visual data matching the real Gates of Olympus game screenshots
const SYM_DEF = {
  // High value — circular ornate designs on dark jewelled backgrounds
  zeus:      { emoji: null, label: 'ZS', bg: 'radial-gradient(circle at 38% 32%, #c8e8ff, #5a9fd4 38%, #1a4a8a 70%, #0a2458 100%)', outline: '#6ab4e8', img: null },
  crown:     { emoji: null, label: 'CR', bg: 'radial-gradient(circle at 38% 32%, #fffae0, #f5c542 38%, #c8831e 65%, #7a4a0a 100%)', outline: '#f5c542', img: null },
  hourglass: { emoji: null, label: 'HG', bg: 'radial-gradient(circle at 38% 32%, #e8f8ff, #60c8e8 38%, #1a7aa0 65%, #083858 100%)', outline: '#60c8e8', img: null },
  ring:      { emoji: null, label: 'RG', bg: 'radial-gradient(circle at 38% 32%, #ffe8f8, #d060b8 38%, #881a78 65%, #440a48 100%)', outline: '#d060b8', img: null },
  goblet:    { emoji: null, label: 'GB', bg: 'radial-gradient(circle at 38% 32%, #e8f8e8, #50c850 38%, #207820 65%, #083808 100%)', outline: '#50c850', img: null },
  // Low value — flat faceted gem shapes
  red:       { emoji: null, label: 'RD', bg: 'radial-gradient(circle at 38% 32%, #ffe8e0, #e84020 55%, #801000 100%)', outline: '#e84020', shape: 'gem' },
  blue:      { emoji: null, label: 'BL', bg: 'radial-gradient(circle at 38% 32%, #d0e8ff, #2080e8 55%, #0038a0 100%)', outline: '#2080e8', shape: 'gem' },
  green:     { emoji: null, label: 'GR', bg: 'radial-gradient(circle at 38% 32%, #d8ffd8, #28c028 55%, #005800 100%)', outline: '#28c028', shape: 'gem' },
  yellow:    { emoji: null, label: 'YW', bg: 'radial-gradient(circle at 38% 32%, #fff8c0, #d8a020 55%, #785000 100%)', outline: '#d8a020', shape: 'gem' },
  scatter:   { emoji: null, label: 'SC', bg: 'radial-gradient(circle at 38% 32%, #e0e8ff, #6878e8 38%, #2030b8 65%, #080828 100%)', outline: '#8898ff', img: null },
};

// The real symbols are rendered as SVG-drawn styled tiles that match the game screenshots
function SymbolIcon({ sym, size = 40 }) {
  const def = SYM_DEF[sym] || SYM_DEF.red;

  if (sym === 'scatter') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <div className="w-[85%] h-[85%] rounded-[6px] flex flex-col items-center justify-center"
          style={{ background: def.bg, border: `2px solid ${def.outline}`, boxShadow: `0 0 8px ${def.outline}88` }}>
          {/* Zeus face + crown for scatter */}
          <div style={{ fontSize: size * 0.38, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}>👑</div>
          <span style={{ fontSize: size * 0.2, fontWeight: 900, fontFamily: 'Georgia,serif', color: '#fffbe0', letterSpacing: '0.04em', lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>SCATTER</span>
        </div>
      </div>
    );
  }

  // Gem shapes (low value) — triangular faceted style from screenshots
  if (def.shape === 'gem') {
    const colors = {
      red: ['#ff8070', '#e84020', '#801000'],
      blue: ['#90c8ff', '#2080e8', '#0038a0'],
      green: ['#90ff90', '#28c028', '#005800'],
      yellow: ['#ffe870', '#d8a020', '#785000'],
    };
    const [light, mid, dark] = colors[sym] || colors.red;
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 60 70" width="75%" height="75%" style={{ filter: `drop-shadow(0 0 5px ${mid}bb)` }}>
          {/* Main gem body — diamond/triangle shape */}
          <polygon points="30,2 58,22 50,65 10,65 2,22" fill={mid} />
          <polygon points="30,2 58,22 50,65 10,65 2,22" fill="url(#gfade)" />
          {/* Facets */}
          <polygon points="30,2 58,22 30,28" fill={light} opacity="0.7" />
          <polygon points="30,2 2,22 30,28" fill={light} opacity="0.35" />
          <polygon points="30,28 58,22 50,65" fill={dark} opacity="0.5" />
          <polygon points="30,28 2,22 10,65" fill={dark} opacity="0.7" />
          <polygon points="10,65 50,65 30,28" fill={mid} opacity="0.9" />
          {/* Highlight spark */}
          <ellipse cx="22" cy="12" rx="5" ry="3" fill="white" opacity="0.5" transform="rotate(-20 22 12)" />
          <defs>
            <linearGradient id="gfade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="black" stopOpacity="0.25"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // High value — round ornate symbols
  const icons = {
    zeus:      () => (
      <svg viewBox="0 0 60 60" width="80%" height="80%" style={{ filter: `drop-shadow(0 0 6px #6ab4e8bb)` }}>
        <circle cx="30" cy="30" r="28" fill="#1a4a8a" />
        <circle cx="30" cy="30" r="28" fill="url(#zfade)" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="#6ab4e8" strokeWidth="1.5" />
        {/* Zeus lightning bolt + bearded face simplified */}
        <text x="30" y="37" textAnchor="middle" fontSize="26" fontFamily="serif" fill="#c8e8ff" style={{fontWeight:'bold'}}>⚡</text>
        <ellipse cx="18" cy="12" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-30 18 12)" />
        <defs>
          <radialGradient id="zfade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.4"/>
          </radialGradient>
        </defs>
      </svg>
    ),
    crown: () => (
      <svg viewBox="0 0 60 60" width="80%" height="80%" style={{ filter: 'drop-shadow(0 0 6px #f5c542bb)' }}>
        <circle cx="30" cy="30" r="28" fill="#7a4a0a" />
        <circle cx="30" cy="30" r="28" fill="url(#crfade)" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="#f5c542" strokeWidth="1.5" />
        <text x="30" y="38" textAnchor="middle" fontSize="26" fontFamily="serif" fill="#ffe080">👑</text>
        <ellipse cx="18" cy="12" rx="4" ry="2.5" fill="white" opacity="0.4" transform="rotate(-30 18 12)" />
        <defs>
          <radialGradient id="crfade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.45"/>
          </radialGradient>
        </defs>
      </svg>
    ),
    hourglass: () => (
      <svg viewBox="0 0 60 60" width="80%" height="80%" style={{ filter: 'drop-shadow(0 0 6px #60c8e8bb)' }}>
        <circle cx="30" cy="30" r="28" fill="#083858" />
        <circle cx="30" cy="30" r="28" fill="url(#hgfade)" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="#60c8e8" strokeWidth="1.5" />
        <text x="30" y="38" textAnchor="middle" fontSize="26" fontFamily="serif" fill="#b0e8f8">⏳</text>
        <ellipse cx="18" cy="12" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-30 18 12)" />
        <defs>
          <radialGradient id="hgfade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.4"/>
          </radialGradient>
        </defs>
      </svg>
    ),
    ring: () => (
      <svg viewBox="0 0 60 60" width="80%" height="80%" style={{ filter: 'drop-shadow(0 0 6px #d060b8bb)' }}>
        <circle cx="30" cy="30" r="28" fill="#440a48" />
        <circle cx="30" cy="30" r="28" fill="url(#rgfade)" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="#d060b8" strokeWidth="1.5" />
        <text x="30" y="38" textAnchor="middle" fontSize="26" fontFamily="serif" fill="#f8c0f0">💍</text>
        <ellipse cx="18" cy="12" rx="4" ry="2.5" fill="white" opacity="0.38" transform="rotate(-30 18 12)" />
        <defs>
          <radialGradient id="rgfade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.45"/>
          </radialGradient>
        </defs>
      </svg>
    ),
    goblet: () => (
      <svg viewBox="0 0 60 60" width="80%" height="80%" style={{ filter: 'drop-shadow(0 0 6px #50c850bb)' }}>
        <circle cx="30" cy="30" r="28" fill="#083808" />
        <circle cx="30" cy="30" r="28" fill="url(#gbfade)" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="#50c850" strokeWidth="1.5" />
        <text x="30" y="38" textAnchor="middle" fontSize="26" fontFamily="serif" fill="#c0f8c0">🏆</text>
        <ellipse cx="18" cy="12" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-30 18 12)" />
        <defs>
          <radialGradient id="gbfade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.4"/>
          </radialGradient>
        </defs>
      </svg>
    ),
  };

  const IconFn = icons[sym];
  return (
    <div className="w-full h-full flex items-center justify-center">
      {IconFn ? <IconFn /> : <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>?</span>}
    </div>
  );
}

// Multiplier symbol — green circle with wings and ×N text, exactly like screenshots
function MultSymbol({ value }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative flex flex-col items-center justify-center" style={{ width: '88%', height: '88%' }}>
        {/* Wings left */}
        <svg viewBox="0 0 120 70" className="absolute w-full" style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 0, pointerEvents: 'none' }}>
          {/* Left wing */}
          <path d="M52,35 C38,18 10,15 2,30 C14,28 30,32 42,38 Z" fill="#d4b820" opacity="0.9" />
          <path d="M52,35 C38,28 14,28 4,40 C16,36 34,38 44,40 Z" fill="#f8e060" opacity="0.7" />
          {/* Right wing */}
          <path d="M68,35 C82,18 110,15 118,30 C106,28 90,32 78,38 Z" fill="#d4b820" opacity="0.9" />
          <path d="M68,35 C82,28 106,28 116,40 C104,36 86,38 76,40 Z" fill="#f8e060" opacity="0.7" />
        </svg>
        {/* Circle */}
        <div className="relative z-10 rounded-full flex items-center justify-center"
          style={{ width: '60%', height: '60%', background: 'radial-gradient(circle at 35% 30%, #a0e878, #48b820 50%, #207000)', border: '2.5px solid #ffe060', boxShadow: '0 0 10px rgba(100,220,50,0.8), inset 0 0 8px rgba(200,255,100,0.4)' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '12px', color: '#fffbe0', textShadow: '0 1px 2px rgba(0,0,0,0.8)', lineHeight: 1 }}>×{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function GatesSymbol({ sym, highlight, size = 40 }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ padding: '2px' }}>
        <MultSymbol value={v} />
      </div>
    );
  }

  const def = SYM_DEF[sym] || SYM_DEF.red;
  const isRound = !def.shape; // high-value + scatter = round design

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-[5px]"
      style={{
        background: isRound ? 'transparent' : '#1a0a28',
        border: highlight ? `2px solid #ffd840` : `1px solid rgba(255,255,255,0.1)`,
        boxShadow: highlight
          ? '0 0 0 2px rgba(255,200,60,0.5), 0 0 12px rgba(255,200,60,0.7), inset 0 0 8px rgba(255,210,80,0.25)'
          : 'none',
      }}
    >
      <SymbolIcon sym={sym} size={size} />
      {highlight && (
        <div className="absolute inset-0 pointer-events-none rounded-[5px]"
          style={{ background: 'linear-gradient(135deg,rgba(255,220,80,0.15),transparent 60%)', border: '1px solid rgba(255,200,60,0.4)' }} />
      )}
    </div>
  );
}