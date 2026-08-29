import React from 'react';
import { isMult, multValue, multColor } from '@/lib/gatesEngine';

// AI-generated symbol images matching the real Gates of Olympus game screenshots
const SYM_IMG = {
  zeus:      'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/4948c7cf4_file_00000000e1408207955e20cec7981d33.png',
  crown:     'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/a4332bd7e_file_0000000095bc8207a1c24e7d2fa722cf.png',
  hourglass: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/be9cc5ec1_file_000000000bd08207a5a1b4e77ea10f33.png',
  ring:      'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/73a72a368_file_0000000013888230a3cd720eb1652b16.png',
  goblet:    'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/03fca0540_file_00000000fc488207a16c5e1464febce2.png',
  red:       'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/b9b6c1bde_file_00000000004c8207b95b7bf99154cb6d.png',
  blue:      'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/a3a411a0b_file_0000000004448207843751971532abdf.png',
  green:     'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/d3a4e2228_file_000000009bc08207a95209fcf33e096b.png',
  yellow:    'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/3829a472c_file_000000000e088230b3afc17f467dd494.png',
  scatter:   'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/e121379a7_file_000000008b68820baaa63ab2e653d35f.png',
  mult:      'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/05d1b7bd2_file_00000000bf888230ad3b50315b7d1792.png',
  mult_blue: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/d7806105b_file_00000000c01481f886567f0ea4c79c5e.png',
  mult_pink: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/1b3f46fa4_file_000000006288820bb1867ae53a90b18e.png',
  mult_red:  'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/744c32f73_file_000000009458820bb0170dc02a86f11c.png',
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
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
});

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    const color = multColor(v);
    const multUrl = SYM_IMG[`mult_${color}`] || SYM_IMG.mult;
    // Render as a solid, fully opaque image (like the normal symbols) so the
    // red & pink value symbols read clearly instead of as a faint glow.
    const size = color === 'red' ? '132%' : color === 'pink' ? '128%' : '124%';
    const scale = color === 'red' ? 1.5 : color === 'pink' ? 1.36 : 1.28;
    const style = {
      backgroundImage: `url(${multUrl})`,
      backgroundSize: size,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transform: `scale(${scale}) translateZ(0)`,
      transformOrigin: 'center center',
      filter: 'saturate(1.25) contrast(1.08)',
      backfaceVisibility: 'hidden',
    };
    return (
      <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
        style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <div className="w-full h-full" style={style} />
      </div>
    );
  }

  const img = SYM_IMG[sym];
  const isScatter = sym === 'scatter';
  const style = isScatter
    ? { ...imgStyle(img), backgroundSize: '108%', transform: 'scale(1.18)', transformOrigin: 'center center' }
    : imgStyle(img);
  return (
    <div className="w-full h-full flex items-center justify-center relative rounded-[5px] overflow-hidden"
      style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
      {img ? (
        <div className="w-full h-full" style={style} />
      ) : (
        <span style={{ fontSize: 24 }}>{sym}</span>
      )}
    </div>
  );
}