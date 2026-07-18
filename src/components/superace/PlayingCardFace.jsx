import React from 'react';

// Court-card SVG art for SuperAce playing-card tiles.
// viewBox 64x88 (3:4-ish). Drawn flat/vector to mimic real casino deck faces.

const RED = '#d32f2f';
const ORANGE = '#e64a19';
const BLUE = '#1976d2';
const DARK = '#263238';
const GOLD = '#f5c542';
const GOLD_DEEP = '#b8860b';

// Shared face/skin tones
const SKIN = '#f5d6b3';
const SKIN_SHADE = '#e3b48a';

function Crown({ x = 16, y = 6, color = GOLD }) {
  return (
    <g>
      <path d={`M${x} ${y + 14} L${x - 4} ${y} L${x + 4} ${y + 8} L${x + 8} ${y} L${x + 12} ${y + 8} L${x + 16} ${y} L${x + 20} ${y + 14} Z`} fill={color} stroke={GOLD_DEEP} strokeWidth="1" strokeLinejoin="round" />
      <circle cx={x} cy={y + 1} r="1.6" fill="#fff" />
      <circle cx={x + 8} cy={y + 1} r="1.6" fill={RED} />
      <circle cx={x + 16} cy={y + 1} r="1.6" fill={BLUE} />
    </g>
  );
}

// KING — crown, bearded face, blue robe with gold collar
function KingArt({ accent = BLUE }) {
  return (
    <g>
      <Crown x={24} y={9} color={GOLD} />
      {/* face */}
      <ellipse cx="32" cy="30" rx="9" ry="10" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.8" />
      {/* beard */}
      <path d="M23 33 Q32 50 41 33 Q40 42 32 45 Q24 42 23 33 Z" fill="#5a4632" />
      {/* eyes */}
      <circle cx="29" cy="29" r="1.1" fill={DARK} />
      <circle cx="35" cy="29" r="1.1" fill={DARK} />
      {/* mustache */}
      <path d="M27 34 Q32 36 37 34 Q34 38 32 37 Q30 38 27 34 Z" fill="#5a4632" />
      {/* robe */}
      <path d="M18 48 Q32 44 46 48 L50 80 L14 80 Z" fill={accent} stroke={GOLD_DEEP} strokeWidth="1" />
      {/* collar */}
      <path d="M22 47 Q32 53 42 47 L40 56 Q32 60 24 56 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" />
      {/* scepter */}
      <rect x="43" y="40" width="2" height="30" fill={GOLD_DEEP} />
      <circle cx="44" cy="39" r="3" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" />
    </g>
  );
}

// QUEEN — crown/veil, face, red/gold dress
function QueenArt({ accent = RED }) {
  return (
    <g>
      <Crown x={24} y={9} color={GOLD} />
      {/* hair veil */}
      <path d="M21 22 Q32 14 43 22 L43 44 Q38 46 32 45 Q26 46 21 44 Z" fill="#7a4a1a" opacity="0.85" />
      {/* face */}
      <ellipse cx="32" cy="31" rx="8.5" ry="9.5" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.8" />
      {/* eyes */}
      <circle cx="29" cy="30" r="1.1" fill={DARK} />
      <circle cx="35" cy="30" r="1.1" fill={DARK} />
      {/* lips */}
      <path d="M29 35 Q32 37 35 35" fill={RED} />
      {/* dress */}
      <path d="M20 46 Q32 43 44 46 L48 80 L16 80 Z" fill={accent} stroke={GOLD_DEEP} strokeWidth="1" />
      {/* collar gems */}
      <path d="M24 46 Q32 51 40 46 L38 54 Q32 57 26 54 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <circle cx="32" cy="52" r="1.6" fill="#fff" />
    </g>
  );
}

// JACK — feathered hat, young face, blue/white outfit
function JackArt({ accent = BLUE }) {
  return (
    <g>
      {/* hat */}
      <path d="M20 14 Q32 4 44 14 L44 20 L20 20 Z" fill={accent} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <path d="M44 12 Q50 8 48 16 Q46 18 44 18 Z" fill={RED} />
      {/* face */}
      <ellipse cx="32" cy="32" rx="8.5" ry="9.5" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.8" />
      {/* hair */}
      <path d="M23 26 Q24 22 28 22 L36 22 Q40 22 41 26" fill="#3a2a18" />
      {/* eyes */}
      <circle cx="29" cy="31" r="1.1" fill={DARK} />
      <circle cx="35" cy="31" r="1.1" fill={DARK} />
      {/* smile */}
      <path d="M29 36 Q32 38 35 36" fill="none" stroke={DARK} strokeWidth="1" />
      {/* collar / outfit */}
      <path d="M19 46 Q32 43 45 46 L48 80 L16 80 Z" fill="#f7f7f7" stroke={GOLD_DEEP} strokeWidth="0.8" />
      <path d="M24 45 Q32 52 40 45 L38 56 Q32 60 26 56 Z" fill={accent} stroke={GOLD_DEEP} strokeWidth="0.8" />
    </g>
  );
}

// ACE — big ornate A with crown + laurel
function AceArt({ accent = DARK }) {
  return (
    <g>
      <Crown x={24} y={8} color={GOLD} />
      <path d="M32 24 L18 70 L24 70 L27 60 L37 60 L40 70 L46 70 Z" fill={accent} stroke={GOLD_DEEP} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M29 50 L35 50" stroke={GOLD} strokeWidth="2.5" />
      <circle cx="32" cy="30" r="2" fill={GOLD} />
    </g>
  );
}

const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR = { S: DARK, H: RED, D: ORANGE, C: BLUE };

function SuitArt({ sym }) {
  const color = SUIT_COLOR[sym];
  return (
    <g>
      {/* big central suit */}
      <text x="32" y="56" fontSize="40" textAnchor="middle" fill={color} style={{ fontFamily: 'Georgia, serif' }}>{SUIT_GLYPH[sym]}</text>
    </g>
  );
}

export default function PlayingCardFace({ sym, golden }) {
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = ['S', 'H', 'D', 'C'].includes(sym);
  const accent = { A: DARK, K: BLUE, Q: RED, J: BLUE }[sym];

  // corner index letter + tiny suit
  const cornerLetter = isFace ? sym : SUIT_GLYPH[sym];
  const cornerColor = isFace ? accent : SUIT_COLOR[sym];

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* corner index top-left */}
      <div className="absolute top-[2px] left-[3px] z-10 leading-none" style={{ textAlign: 'left' }}>
        <span className="block text-[10px] font-black" style={{ color: cornerColor, fontFamily: 'Georgia, serif' }}>{cornerLetter}</span>
        {isFace && <span className="block text-[7px] -mt-0.5" style={{ color: cornerColor }}>{SUIT_GLYPH_FOR_FACE(sym)}</span>}
      </div>
      {/* corner index bottom-right (rotated) */}
      <div className="absolute bottom-[2px] right-[3px] z-10 leading-none" style={{ transform: 'rotate(180deg)' }}>
        <span className="block text-[10px] font-black" style={{ color: cornerColor, fontFamily: 'Georgia, serif' }}>{cornerLetter}</span>
        {isFace && <span className="block text-[7px] -mt-0.5" style={{ color: cornerColor }}>{SUIT_GLYPH_FOR_FACE(sym)}</span>}
      </div>

      {/* center art */}
      <svg viewBox="0 0 64 88" className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ filter: golden ? 'sepia(0.35) saturate(1.6) brightness(1.08)' : 'none' }}>
        {sym === 'K' && <KingArt accent={accent} />}
        {sym === 'Q' && <QueenArt accent={accent} />}
        {sym === 'J' && <JackArt accent={accent} />}
        {sym === 'A' && <AceArt accent={accent} />}
        {isSuit && <SuitArt sym={sym} />}
      </svg>
    </div>
  );
}

function SUIT_GLYPH_FOR_FACE(sym) {
  // faces use a representative suit pip in corner (K/Q share spade/heart vibe)
  return { A: '♠', K: '♠', Q: '♥', J: '♣' }[sym] || '';
}