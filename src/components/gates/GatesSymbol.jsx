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
      <div className="w-full h-full flex items-center justify-center relative">
        <img src={SYM_IMG.mult} alt={`mult-${v}`} className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 4px rgba(100,220,50,0.6))' }} />
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
        border: highlight ? '2px solid #ffd840' : 'none',
        boxShadow: highlight
          ? '0 0 0 2px rgba(255,200,60,0.5), 0 0 14px rgba(255,200,60,0.8), inset 0 0 10px rgba(255,210,80,0.3)'
          : 'none',
        background: highlight ? 'rgba(255,200,60,0.08)' : 'transparent',
        transition: 'box-shadow 0.15s, border 0.15s',
      }}
    >
      {img ? (
        <img src={img} alt={sym} className="w-full h-full object-contain" style={{ imageRendering: 'auto' }} />
      ) : (
        <span style={{ fontSize: 24 }}>{sym}</span>
      )}
    </div>
  );
}