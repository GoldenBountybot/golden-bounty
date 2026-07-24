import React from 'react';
import { VALUE_COIN_IMG } from './argonautsEngine';

// Rapid vertical stream of falling coins shown inside an empty coin-round
// cell while a reel is dropping. Many coins appear to fall at speed; the
// final one lands and sticks (handled by the parent revealing the stuck tile).
// 3 identical coin blocks → seamless -33%→0 loop (one cell per cycle).
export default function CoinDropStream({ turbo }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #5a0808 0%, #4D0505 70%)' }}
    >
      <div
        className="flex flex-col w-full"
        style={{ animation: `coinStreamFall ${turbo ? 0.3 : 0.48}s linear infinite`, willChange: 'transform' }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-full" style={{ aspectRatio: '1 / 1' }}>
            <img
              src={VALUE_COIN_IMG}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'screen', transform: 'scale(1.12)', filter: 'drop-shadow(0 0 6px rgba(255,210,80,0.6))' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}