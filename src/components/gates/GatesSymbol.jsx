import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// AI-generated symbol images matching the real Gates of Olympus game screenshots
const SYM_IMG = {
  zeus:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1e4f4872c_generated_image.png',
  crown:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/732191668_generated_image.png',
  hourglass: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/18c64007b_generated_image.png',
  ring:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6f31611ef_generated_image.png',
  goblet:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/37a8458f3_generated_image.png',
  red:       'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9b3c34b0e_generated_image.png',
  blue:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/634ba6f60_generated_image.png',
  green:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bbd709972_generated_image.png',
  yellow:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ec54fd8b6_generated_image.png',
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7e8af7ca0_generated_image.png',
  mult:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/17772ef4b_generated_image.png',
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
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        filter: highlight ? 'drop-shadow(0 0 6px rgba(255,210,80,0.95))' : 'none',
        transition: 'filter 0.15s',
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