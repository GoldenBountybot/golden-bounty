import React from 'react';

// Classic court-card SVG art for SuperAce playing-card tiles.
// Layout: top-half portrait + 180° mirrored bottom half (authentic deck style).
// viewBox 64x92, mirror axis at y=46.

const RED = '#c62828';
const RED_BRIGHT = '#e53935';
const BLUE = '#1565c0';
const DARK = '#1b1b1b';
const GOLD = '#f2c53a';
const GOLD_DEEP = '#a87f12';
const SKIN = '#f3d3ad';
const SKIN_SHADE = '#dcae84';
const HAIR = '#3a2415';

// ---- Greek-key meander band (decorative) ----
function GreekKey({ y, width = 44, x = 10 }) {
  const cells = 6;
  const cw = width / cells;
  const items = [];
  for (let i = 0; i < cells; i++) {
    const cx = x + i * cw;
    items.push(<rect key={`b${i}`} x={cx} y={y} width={cw - 1.5} height="6" fill="none" stroke={GOLD} strokeWidth="1.1" />);
    if (i % 2 === 0) items.push(<rect key={`f${i}`} x={cx + 1.5} y={y + 1.5} width={cw - 4.5} height="3" fill={GOLD} />);
  }
  return <g>{items}</g>;
}

// ---- Crown (shared) ----
function Crown({ cx = 32, y = 3, w = 18, color = GOLD }) {
  const x0 = cx - w / 2;
  return (
    <g>
      <path d={`M${x0} ${y + 12} L${x0} ${y + 3} L${x0 + w * 0.25} ${y + 8} L${cx} ${y} L${x0 + w * 0.75} ${y + 8} L${x0 + w} ${y + 3} L${x0 + w} ${y + 12} Z`} fill={color} stroke={GOLD_DEEP} strokeWidth="0.9" strokeLinejoin="round" />
      <circle cx={x0} cy={y + 3.5} r="1.4" fill="#fff" stroke={GOLD_DEEP} strokeWidth="0.4" />
      <circle cx={cx} cy={y + 0.5} r="1.6" fill={RED_BRIGHT} stroke={GOLD_DEEP} strokeWidth="0.4" />
      <circle cx={x0 + w} cy={y + 3.5} r="1.4" fill="#fff" stroke={GOLD_DEEP} strokeWidth="0.4" />
      <rect x={x0 + 1} y={y + 11} width={w - 2} height="2.2" fill={GOLD_DEEP} opacity="0.55" />
    </g>
  );
}

// ---- Face base ----
function Face({ cy = 24, rx = 8.4, ry = 9.2 }) {
  return <ellipse cx="32" cy={cy} rx={rx} ry={ry} fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.7" />;
}

// ---- KING (top half) ----
function KingTop() {
  return (
    <g>
      <Crown cx={32} y={3} />
      {/* hair sides */}
      <path d="M23 22 Q22 30 25 34 L27 30 Z" fill={HAIR} />
      <path d="M41 22 Q42 30 39 34 L37 30 Z" fill={HAIR} />
      <Face cy={24} />
      {/* eyes */}
      <circle cx="29" cy="23" r="0.95" fill={DARK} />
      <circle cx="35" cy="23" r="0.95" fill={DARK} />
      {/* eyebrows */}
      <path d="M27 20 L31 20.5" stroke={HAIR} strokeWidth="0.9" />
      <path d="M33 20.5 L37 20" stroke={HAIR} strokeWidth="0.9" />
      {/* beard */}
      <path d="M24 27 Q26 38 32 39 Q38 38 40 27 Q39 32 32 33 Q25 32 24 27 Z" fill={HAIR} />
      {/* mustache */}
      <path d="M28 26 Q32 27.5 36 26 Q34 29 32 28.5 Q30 29 28 26 Z" fill={HAIR} />
      {/* cigar */}
      <rect x="35" y="28" width="6" height="1.6" rx="0.6" fill="#5a3a1a" stroke={DARK} strokeWidth="0.3" />
      <rect x="40.4" y="28" width="1.4" height="1.6" fill={RED_BRIGHT} />
      {/* smoke */}
      <path d="M41 27 Q43 23 41 19 Q39 15 42 11" fill="none" stroke="#9aa0a6" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
      <path d="M43 27 Q45 22 43 17" fill="none" stroke="#bdc1c6" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
      {/* robe shoulders + collar */}
      <path d="M17 40 Q32 36 47 40 L49 46 L15 46 Z" fill={BLUE} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <GreekKey y={41.5} />
      <path d="M24 39 Q32 44 40 39 L38 44 Q32 46 26 44 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.5" />
    </g>
  );
}

// ---- QUEEN (top half) ----
function QueenTop() {
  return (
    <g>
      <Crown cx={32} y={3} />
      {/* hair framing */}
      <path d="M22 18 Q24 12 32 11 Q40 12 42 18 L42 34 Q40 36 38 35 L38 24 Q36 22 32 22 Q28 22 26 24 L26 35 Q24 36 22 34 Z" fill={HAIR} />
      <Face cy={24} rx={7.8} ry={8.8} />
      {/* eyes */}
      <circle cx="29" cy="23" r="0.95" fill={DARK} />
      <circle cx="35" cy="23" r="0.95" fill={DARK} />
      {/* lashes */}
      <path d="M27 21 L30 21.5" stroke={DARK} strokeWidth="0.7" />
      <path d="M34 21.5 L37 21" stroke={DARK} strokeWidth="0.7" />
      {/* lips */}
      <path d="M29 27 Q32 28.5 35 27 Q34 29 32 29 Q30 29 29 27 Z" fill={RED} />
      {/* necklace */}
      <path d="M26 34 Q32 38 38 34" fill="none" stroke={GOLD} strokeWidth="1" />
      <circle cx="32" cy="37.5" r="1.3" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.4" />
      {/* dress shoulders */}
      <path d="M18 40 Q32 37 46 40 L48 46 L16 46 Z" fill={RED} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <GreekKey y={41.5} />
      {/* goblet */}
      <path d="M37 40 L41 40 L40.5 43 L37.5 43 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.4" />
      <rect x="38.8" y="43" width="1.2" height="2.2" fill={GOLD} />
      <ellipse cx="39.4" cy="45.6" rx="2" ry="0.6" fill={GOLD} />
    </g>
  );
}

// ---- JACK (top half) ----
function JackTop() {
  return (
    <g>
      {/* plumed hat */}
      <path d="M21 13 Q32 5 43 13 L43 19 L21 19 Z" fill={BLUE} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <path d="M43 11 Q52 6 49 16 Q47 18 44 18 Z" fill={RED} />
      <rect x="21" y="18" width="22" height="2.2" fill={GOLD} />
      <Face cy={24} />
      {/* hair */}
      <path d="M24 19 L26 25 M40 19 L38 25" stroke={HAIR} strokeWidth="1.4" />
      {/* eyes */}
      <circle cx="29" cy="23" r="0.95" fill={DARK} />
      <circle cx="35" cy="23" r="0.95" fill={DARK} />
      {/* smile */}
      <path d="M29 27 Q32 28.5 35 27" fill="none" stroke={DARK} strokeWidth="0.8" />
      {/* collar */}
      <path d="M18 40 Q32 37 46 40 L48 46 L16 46 Z" fill="#f4f4f4" stroke={GOLD_DEEP} strokeWidth="0.8" />
      <GreekKey y={41.5} />
      <path d="M25 39 Q32 44 39 39 L37 45 Q32 47 27 45 Z" fill={BLUE} stroke={GOLD_DEEP} strokeWidth="0.5" />
    </g>
  );
}

// ---- ACE (top half) — ornate A ----
function AceTop() {
  return (
    <g>
      <Crown cx={32} y={2} w={16} />
      <path d="M32 18 L20 44 L26 44 L29 36 L35 36 L38 44 L44 44 Z" fill={DARK} stroke={GOLD_DEEP} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M29.5 31 L34.5 31" stroke={GOLD} strokeWidth="2.2" />
      <GreekKey y={42} width={28} x={18} />
    </g>
  );
}

// ---- SUIT (full card, no mirror) ----
const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR = { S: DARK, H: RED_BRIGHT, D: '#e64a19', C: BLUE };

function SuitFace({ sym }) {
  const c = SUIT_COLOR[sym];
  return (
    <g>
      {/* central big pip */}
      <text x="32" y="58" fontSize="42" textAnchor="middle" fill={c} style={{ fontFamily: 'Georgia, serif' }}>{SUIT_GLYPH[sym]}</text>
      {/* decorative side flourishes */}
      <path d="M8 46 Q14 50 8 54" fill="none" stroke={c} strokeWidth="0.9" opacity="0.5" />
      <path d="M56 46 Q50 50 56 54" fill="none" stroke={c} strokeWidth="0.9" opacity="0.5" />
    </g>
  );
}

// Corner suit pip used under face-card index
const FACE_CORNER_PIP = { A: '♠', K: '♠', Q: '♥', J: '♣' };
const FACE_ACCENT = { A: DARK, K: BLUE, Q: RED, J: BLUE };

export default function PlayingCardFace({ sym, golden }) {
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = ['S', 'H', 'D', 'C'].includes(sym);

  const topArt = {
    K: <KingTop />,
    Q: <QueenTop />,
    J: <JackTop />,
    A: <AceTop />,
  }[sym];

  const indexLetter = isFace ? sym : SUIT_GLYPH[sym];
  const indexColor = isFace ? FACE_ACCENT[sym] : SUIT_COLOR[sym];
  const indexPip = isFace ? FACE_CORNER_PIP[sym] : null;

  const sepia = golden ? 'sepia(0.4) saturate(1.7) brightness(1.08) hue-rotate(-4deg)' : 'none';

  return (
    <div className="absolute inset-0">
      {/* corner indices */}
      <div className="absolute z-10 leading-none" style={{ top: 2, left: 3 }}>
        <span className="block text-[11px] font-black" style={{ color: indexColor, fontFamily: 'Georgia, serif', textShadow: '0 0.5px 0 rgba(0,0,0,0.15)' }}>{indexLetter}</span>
        {indexPip && <span className="block text-[8px] -mt-0.5 leading-none" style={{ color: indexColor }}>{indexPip}</span>}
      </div>
      <div className="absolute z-10 leading-none" style={{ bottom: 2, right: 3, transform: 'rotate(180deg)' }}>
        <span className="block text-[11px] font-black" style={{ color: indexColor, fontFamily: 'Georgia, serif' }}>{indexLetter}</span>
        {indexPip && <span className="block text-[8px] -mt-0.5 leading-none" style={{ color: indexColor }}>{indexPip}</span>}
      </div>

      <svg viewBox="0 0 64 92" className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ filter: sepia }}>
        {isFace && (
          <>
            <g>{topArt}</g>
            <g transform="rotate(180 32 46)">{topArt}</g>
          </>
        )}
        {isSuit && <SuitFace sym={sym} />}
      </svg>
    </div>
  );
}