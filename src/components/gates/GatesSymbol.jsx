import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// AI-generated symbol images matching the real Gates of Olympus game screenshots
const SYM_IMG = {
  zeus:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4948c7cf4_file_00000000e1408207955e20cec7981d33.png',
  crown:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a4332bd7e_file_0000000095bc8207a1c24e7d2fa722cf.png',
  hourglass: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/be9cc5ec1_file_000000000bd08207a5a1b4e77ea10f33.png',
  ring:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/73a72a368_file_0000000013888230a3cd720eb1652b16.png',
  goblet:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/03fca0540_file_00000000fc488207a16c5e1464febce2.png',
  red:       'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b9b6c1bde_file_00000000004c8207b95b7bf99154cb6d.png',
  blue:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a3a411a0b_file_0000000004448207843751971532abdf.png',
  green:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d3a4e2228_file_000000009bc08207a95209fcf33e096b.png',
  yellow:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/3829a472c_file_000000000e088230b3afc17f467dd494.png',
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fbae605ef_file_00000000b9808207b8b4c2abccaa2254.png',
  mult:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/138a9cee6_generated_image.png',
};

export { SYM_IMG };

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
        style={{
          border: 'none',
          boxShadow: 'none',
          background: 'transparent',
        }}>
        <img src={SYM_IMG.mult} alt={`mult-${v}`} className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 4px rgba(100,220,50,0.6)) saturate(1.25) contrast(1.12) brightness(1.05)', mixBlendMode: 'screen' }} />
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '10px', color: '#fffbe0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
          ×{v}
        </span>
      </div>
    );
  }

  const img = SYM_IMG[sym];
  return (
    <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
      style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
      {img ? (
        <img src={img} alt={sym} className="w-full h-full object-contain" style={{ imageRendering: 'auto', mixBlendMode: 'screen', filter: 'saturate(1.25) contrast(1.12) brightness(1.05)' }} />
      ) : (
        <span style={{ fontSize: 24 }}>{sym}</span>
      )}
    </div>
  );
}