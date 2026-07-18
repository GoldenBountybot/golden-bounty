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
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/196f878d8_generated_image.png',
};

const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR = { S: DARK, H: RED_BRIGHT, D: '#e64a19', C: BLUE };
const FACE_ACCENT = { A: DARK, K: BLUE, Q: RED, J: BLUE };
const FACE_CORNER_PIP = { A: '♠', K: '♠', Q: '♥', J: '♣' };

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
  const isAce = sym === 'A';

  const indexLetter = isFace ? sym : SUIT_GLYPH[sym];
  const indexColor = isFace ? FACE_ACCENT[sym] : SUIT_COLOR[sym];
  const indexPip = isFace ? FACE_CORNER_PIP[sym] : null;

  const sepia = golden ? 'sepia(0.8) saturate(2.2) brightness(1.12) hue-rotate(-6deg) contrast(1.05)' : 'none';

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
      {/* Ace realistic image */}
      {isAce && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${COURT_IMG.A}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: sepia,
          }}
        />
      )}
      {/* suit vector art */}
      {isSuit && <div className="absolute inset-0" style={{ filter: sepia }}><SuitArt sym={sym} /></div>}

      {/* subtle inner frame line like real cards */}
      <div className="absolute inset-[3px] rounded-[3px] pointer-events-none" style={{ border: '0.5px solid rgba(0,0,0,0.18)' }} />

      {/* golden tint overlay for golden cards */}
      {golden && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,233,138,0.42) 0%, rgba(245,197,66,0.18) 55%, rgba(160,100,8,0.34) 100%)', mixBlendMode: 'overlay' }} />
      )}

      {/* corner indices */}
      <CornerIndex letter={indexLetter} pip={indexPip} color={indexColor} />
      <CornerIndex letter={indexLetter} pip={indexPip} color={indexColor} flip />
    </div>
  );
}