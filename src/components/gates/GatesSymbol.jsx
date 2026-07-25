import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// AI-generated symbol images matching the real Gates of Olympus game screenshots
const SYM_IMG = {
  zeus:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/89262e8a1_generated_image.png',
  crown:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d64a06a9a_generated_image.png',
  hourglass: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/df587b23a_file_00000000197081fab54f2a6479676a79.png',
  ring:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c1b6cefea_generated_image.png',
  goblet:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6e36c7c39_file_00000000613081fa82be73cb5f04d75b.png',
  red:       'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1a5985b1f_generated_image.png',
  blue:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/cb5a74fad_generated_image.png',
  green:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8372beff3_file_000000003ba081fab925bbd1fa109a95.png',
  yellow:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/dd2299e17_generated_image.png',
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f62b86258_generated_image.png',
  mult:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/138a9cee6_generated_image.png',
};

export { SYM_IMG };

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
        style={{
          border: '1px solid rgba(255,220,140,0.22)',
          boxShadow: '0 0 6px rgba(120,255,90,0.10), inset 0 0 8px rgba(120,255,120,0.06)',
          background: 'radial-gradient(circle at center, rgba(120,255,120,0.10), transparent 72%)',
        }}>
        <img src={SYM_IMG.mult} alt={`mult-${v}`} className="w-full h-full object-cover" style={{ filter: 'drop-shadow(0 0 4px rgba(100,220,50,0.6)) saturate(1.25) contrast(1.12) brightness(1.05)', mixBlendMode: 'lighten' }} />
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '10px', color: '#fffbe0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
          ×{v}
        </span>
      </div>
    );
  }

  const img = SYM_IMG[sym];
  return (
    <div
      className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
      style={{
        border: highlight ? '2px solid #ffe070' : '1px solid rgba(255,220,140,0.22)',
        boxShadow: highlight
          ? '0 0 0 2px rgba(255,235,120,0.9), 0 0 22px rgba(255,220,90,1), inset 0 0 18px rgba(255,230,120,0.6)'
          : '0 0 6px rgba(255,200,90,0.08), inset 0 0 8px rgba(255,220,120,0.06)',
        background: highlight
          ? 'radial-gradient(circle at center, rgba(255,215,90,0.28), rgba(255,180,40,0.10) 60%, transparent 78%)'
          : 'radial-gradient(circle at center, rgba(255,225,130,0.10), transparent 72%)',
        animation: highlight ? 'gatesWinGlow 0.7s ease-in-out infinite' : 'none',
        transition: 'box-shadow 0.15s, border 0.15s, background 0.15s',
      }}
    >
      {img ? (
        <img src={img} alt={sym} className="w-full h-full object-cover" style={{ imageRendering: 'auto', mixBlendMode: 'lighten', filter: 'saturate(1.25) contrast(1.12) brightness(1.05)' }} />
      ) : (
        <span style={{ fontSize: 24 }}>{sym}</span>
      )}
    </div>
  );
}