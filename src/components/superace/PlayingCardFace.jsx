import React from 'react';

// SuperAce playing-card faces — JILI Super Ace style.
// K/Q/J: illustrated profile portraits. A: spade with gold "ACE".
// Suits: clean flat vector shapes. No checkerboard pattern.

const RED = '#c62828';
const RED_BRIGHT = '#d32f2f';
const BLUE = '#2d65a1';
const DARK = '#1a1a1a';
const ORANGE = '#c75b26';

const COURT_IMG = {
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e40b4b48f_generated_image.png',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/21f5a1dbb_generated_image.png',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a23681e83_generated_image.png',
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4e53e6ae2_generated_image.png',
};

const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR = { S: DARK, H: RED_BRIGHT, D: ORANGE, C: BLUE };
const FACE_ACCENT = { A: DARK, K: BLUE, Q: RED, J: BLUE };
const FACE_CORNER_PIP = { A: '♠', K: '♠', Q: '♥', J: '♣' };

// Suit: big centered pip, clean and bold
function SuitArt({ sym }) {
  const c = SUIT_COLOR[sym];
  return (
    <svg viewBox="0 0 64 92" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <text x="32" y="64" fontSize="52" textAnchor="middle" fill={c} style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>{SUIT_GLYPH[sym]}</text>
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
            backgroundPosition: 'center 30%',
            filter: sepia,
          }}
        />
      )}
      {/* Ace image */}
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
      <div className="absolute inset-[3px] rounded-[3px] pointer-events-none" style={{ border: '0.5px solid rgba(0,0,0,0.12)' }} />

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