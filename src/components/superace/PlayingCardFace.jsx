import React from 'react';

// SuperAce playing-card faces.
// K/Q/J: realistic AI court figures. A + suits: clean SVG.
// Corner index (letter + pip) overlaid top-left and inverted bottom-right.

const RED = '#c62828';
const RED_BRIGHT = '#e53935';
const BLUE = '#1565c0';
const DARK = '#1b1b1b';
const GOLD = '#f2c53a';

const COURT_IMG = {
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/aab4c596e_generated_image.png',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/44b48b316_generated_image.png',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/78c7b77e2_generated_image.png',
};

const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR = { S: DARK, H: RED_BRIGHT, D: '#e64a19', C: BLUE };
const FACE_ACCENT = { A: DARK, K: BLUE, Q: RED, J: BLUE };
const FACE_CORNER_PIP = { A: '♠', K: '♠', Q: '♥', J: '♣' };

// Ace: ornate big A with crown + flourishes (SVG)
function AceArt({ color }) {
  return (
    <svg viewBox="0 0 64 92" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* crown */}
      <g>
        <path d="M23 12 L23 4 L29 9 L32 2 L35 9 L41 4 L41 12 Z" fill={GOLD} stroke="#a87f12" strokeWidth="0.8" strokeLinejoin="round" />
        <circle cx="23" cy="4" r="1.5" fill="#fff" />
        <circle cx="32" cy="2.5" r="1.7" fill={RED_BRIGHT} />
        <circle cx="41" cy="4" r="1.5" fill="#fff" />
      </g>
      {/* ornate A */}
      <path d="M32 20 L16 74 L24 74 L28 62 L36 62 L40 74 L48 74 Z" fill={color} stroke="#a87f12" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M29 54 L35 54" stroke={GOLD} strokeWidth="2.6" />
      {/* flourishes */}
      <path d="M14 70 Q20 66 14 62" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M50 70 Q44 66 50 62" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="32" cy="34" r="2.2" fill={GOLD} stroke="#a87f12" strokeWidth="0.4" />
    </svg>
  );
}

// Suit: big centered pip with side flourishes
function SuitArt({ sym }) {
  const c = SUIT_COLOR[sym];
  return (
    <svg viewBox="0 0 64 92" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <text x="32" y="60" fontSize="46" textAnchor="middle" fill={c} style={{ fontFamily: 'Georgia, serif' }}>{SUIT_GLYPH[sym]}</text>
      <path d="M8 48 Q14 52 8 56" fill="none" stroke={c} strokeWidth="1" opacity="0.45" />
      <path d="M56 48 Q50 52 56 56" fill="none" stroke={c} strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

function CornerIndex({ letter, pip, color, flip }) {
  return (
    <div
      className="absolute z-20 leading-none"
      style={flip ? { bottom: 2, right: 3, transform: 'rotate(180deg)' } : { top: 2, left: 3 }}
    >
      <span className="block text-[11px] font-black" style={{ color, fontFamily: 'Georgia, serif', textShadow: '0 0.5px 0 rgba(0,0,0,0.15)' }}>{letter}</span>
      {pip && <span className="block text-[8px] -mt-0.5 leading-none" style={{ color }}>{pip}</span>}
    </div>
  );
}

export default function PlayingCardFace({ sym, golden }) {
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = ['S', 'H', 'D', 'C'].includes(sym);
  const isCourt = ['K', 'Q', 'J'].includes(sym);

  const indexLetter = isFace ? sym : SUIT_GLYPH[sym];
  const indexColor = isFace ? FACE_ACCENT[sym] : SUIT_COLOR[sym];
  const indexPip = isFace ? FACE_CORNER_PIP[sym] : null;

  const sepia = golden ? 'sepia(0.45) saturate(1.7) brightness(1.06) hue-rotate(-4deg)' : 'none';

  return (
    <div className="absolute inset-0">
      {/* court figure image (cover, centered) */}
      {isCourt && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${COURT_IMG[sym]}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            filter: sepia,
          }}
        />
      )}
      {/* Ace / suit vector art */}
      {sym === 'A' && <div className="absolute inset-0" style={{ filter: sepia }}><AceArt color={FACE_ACCENT.A} /></div>}
      {isSuit && <div className="absolute inset-0" style={{ filter: sepia }}><SuitArt sym={sym} /></div>}

      {/* subtle inner frame line like real cards */}
      <div className="absolute inset-[3px] rounded-[3px] pointer-events-none" style={{ border: '0.5px solid rgba(0,0,0,0.18)' }} />

      {/* corner indices */}
      <CornerIndex letter={indexLetter} pip={indexPip} color={indexColor} />
      <CornerIndex letter={indexLetter} pip={indexPip} color={indexColor} flip />
    </div>
  );
}