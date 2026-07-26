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
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e121379a7_file_000000008b68820baaa63ab2e653d35f.png',
  mult:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/05d1b7bd2_file_00000000bf888230ad3b50315b7d1792.png',
};

export { SYM_IMG };

// Render the symbol image directly (full opacity, true colours). The PNG's own
// pure-black background fills the cell, so the symbol shows in its natural
// colour with no alpha-keying artefacts — colours stay vivid and fully opaque.
const imgStyle = (img) => ({
  backgroundImage: `url(${img})`,
  backgroundSize: '112%',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  filter: 'saturate(1.18) contrast(1.06)',
});

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    const multUrl = SYM_IMG.mult;
    const style = {
      backgroundImage: `url(${multUrl})`,
      backgroundSize: '112%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transform: 'scale(1.2)',
      transformOrigin: 'center center',
      filter: 'saturate(1.18) contrast(1.06)',
    };
    return (
      <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
        style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <div className="w-full h-full" style={style} />
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '11px', color: '#fffbe0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
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
        <div className="w-full h-full" style={imgStyle(img)} />
      ) : (
        <span style={{ fontSize: 24 }}>{sym}</span>
      )}
    </div>
  );
}