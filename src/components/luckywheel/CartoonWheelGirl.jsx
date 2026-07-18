import React from 'react';

const SEG_COLORS = ['#D4AF37', '#0B1D48', '#1E8A57', '#B22222', '#D4AF37', '#0B1D48', '#1E8A57', '#B22222'];
const SEG_LABELS = ['2x', '5x', '0', '10x', '50x', '0', '5x', '20x'];
const N = 8;
const CX = 290, CY = 165, R = 70;

function wedge(i) {
  const a0 = (i * 360 / N) * Math.PI / 180;
  const a1 = ((i + 1) * 360 / N) * Math.PI / 180;
  const x0 = CX + R * Math.sin(a0), y0 = CY - R * Math.cos(a0);
  const x1 = CX + R * Math.sin(a1), y1 = CY - R * Math.cos(a1);
  return `M${CX},${CY} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`;
}

export default function CartoonWheelGirl() {
  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ background: 'linear-gradient(to bottom, #1a2a55, #0a1430)', border: '1px solid rgba(212,175,55,0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <svg viewBox="0 0 400 300" className="w-full h-auto block" style={{ display: 'block' }}>
        {/* floor shadow */}
        <ellipse cx="200" cy="282" rx="150" ry="12" fill="rgba(0,0,0,0.35)" />

        {/* ===== GIRL (sways gently) ===== */}
        <g style={{ transformOrigin: '100px 278px', animation: 'cartoonSway 4s ease-in-out infinite' }}>
          {/* legs */}
          <rect x="86" y="250" width="9" height="30" rx="4" fill="#f2c9a0" />
          <rect x="105" y="250" width="9" height="30" rx="4" fill="#f2c9a0" />
          {/* shoes */}
          <ellipse cx="90" cy="282" rx="10" ry="5" fill="#2a1a3a" />
          <ellipse cx="110" cy="282" rx="10" ry="5" fill="#2a1a3a" />

          {/* dress */}
          <path d="M78,168 L122,168 L140,255 L60,255 Z" fill="#1b2d63" stroke="#D4AF37" strokeWidth="2" />
          <path d="M70,232 L130,232 L134,245 L66,245 Z" fill="#D4AF37" opacity="0.85" />
          {/* collar */}
          <path d="M82,168 a18,8 0 0 0 36,0 Z" fill="#f2c9a0" />

          {/* left arm (down) */}
          <path d="M80,175 q-12,18 -10,40" stroke="#f2c9a0" strokeWidth="9" fill="none" strokeLinecap="round" />
          <circle cx="70" cy="217" r="6" fill="#f2c9a0" />

          {/* right arm (pushes the wheel) */}
          <g style={{ transformOrigin: '124px 178px', animation: 'cartoonPush 5s ease-in-out infinite' }}>
            <path d="M124,178 q40,-6 78,8" stroke="#f2c9a0" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="204" cy="188" r="7" fill="#f2c9a0" />
          </g>

          {/* neck */}
          <rect x="93" y="150" width="14" height="20" rx="5" fill="#f2c9a0" />
          {/* head */}
          <circle cx="100" cy="128" r="27" fill="#f7d5b0" />
          {/* hair back */}
          <path d="M73,128 a27,30 0 0 1 54,0 q2,-30 -27,-34 q-29,4 -27,34 Z" fill="#3a2418" />
          {/* hair fringe */}
          <path d="M74,120 q14,-14 26,-8 q12,-6 26,8 q-10,-2 -26,-2 q-16,0 -26,2 Z" fill="#2c1a10" />
          {/* hair side locks */}
          <path d="M74,118 q-4,22 2,34 q-10,-8 -8,-26 Z" fill="#3a2418" />
          <path d="M126,118 q4,22 -2,34 q10,-8 8,-26 Z" fill="#3a2418" />

          {/* face: eyes (blink) */}
          <g style={{ transformOrigin: '100px 128px', animation: 'cartoonBlink 4.5s ease-in-out infinite' }}>
            <ellipse cx="90" cy="128" rx="3.2" ry="4.2" fill="#2a1a10" />
            <ellipse cx="110" cy="128" rx="3.2" ry="4.2" fill="#2a1a10" />
            <circle cx="91" cy="127" r="1" fill="#fff" />
            <circle cx="111" cy="127" r="1" fill="#fff" />
          </g>
          {/* blush */}
          <circle cx="84" cy="136" r="3" fill="#ff9aa2" opacity="0.6" />
          <circle cx="116" cy="136" r="3" fill="#ff9aa2" opacity="0.6" />
          {/* smile */}
          <path d="M92,138 q8,7 16,0" stroke="#b5483a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* ===== WHEEL (spins) ===== */}
        {/* pointer */}
        <polygon points="290,88 280,104 300,104" fill="#E02424" stroke="#7a0d0d" strokeWidth="1.5" />
        {/* outer rim */}
        <circle cx={CX} cy={CY} r={R + 7} fill="#8a7a4a" stroke="#5a4a26" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={R + 3} fill="#D4AF37" />
        {/* spinning segments */}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'cartoonSpin 5s linear infinite' }}>
          {SEG_COLORS.map((c, i) => (
            <path key={i} d={wedge(i)} fill={c} stroke="#1a1a1a" strokeWidth="1" />
          ))}
          {/* segment labels */}
          {SEG_LABELS.map((l, i) => {
            const m = ((i + 0.5) * 360 / N) * Math.PI / 180;
            const tx = CX + 44 * Math.sin(m), ty = CY - 44 * Math.cos(m);
            const deg = (i + 0.5) * 360 / N;
            return (
              <text key={i} x={tx} y={ty} fill="#fff" fontSize="9" fontWeight="700"
                textAnchor="middle" dominantBaseline="middle"
                transform={`rotate(${deg} ${tx} ${ty})`} style={{ fontFamily: 'sans-serif' }}>
                {l}
              </text>
            );
          })}
          {/* hub */}
          <circle cx={CX} cy={CY} r="10" fill="#1A1A1A" stroke="#D4AF37" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="3" fill="#D4AF37" />
        </g>

        {/* sparkle accents */}
        <text x="50" y="50" fill="#D4AF37" fontSize="14">✦</text>
        <text x="350" y="60" fill="#D4AF37" fontSize="12">✦</text>
        <text x="360" y="250" fill="#D4AF37" fontSize="10">✦</text>
      </svg>
    </div>
  );
}