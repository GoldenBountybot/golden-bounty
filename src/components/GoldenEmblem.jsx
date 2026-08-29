import React from 'react';

// The app's signature quad-ring gold emblem with a reeded coin medallion and
// the Golden Bounty logo in the centre. Shared by the app loading screen and
// the game loading screen so both show the exact same iconic ring.

const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png';

export default function GoldenEmblem({ className = '', style }) {
  const studs = Array.from({ length: 12 }, (_, i) => (
    <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${(i / 12) * 360}deg) translateY(-72px)` }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(135deg, #fff3c4, #d4a843)', boxShadow: '0 0 5px rgba(255,210,100,0.85)', transform: 'translate(-50%, -50%)' }} />
    </div>
  ));

  const ridges = Array.from({ length: 36 }, (_, i) => (
    <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${(i / 36) * 360}deg) translateY(-44px)` }}>
      <div style={{ width: '1.5px', height: '6px', background: 'rgba(214,178,98,0.6)', borderRadius: '1px', transform: 'translate(-50%, -50%)' }} />
    </div>
  ));

  return (
    <div
      className={`relative ${className}`}
      style={{ width: '160px', height: '160px', animation: 'appEmblemFloat 4s ease-in-out infinite', ...style }}
    >
      {/* Outer ring — slow spin with 12 gold studs */}
      <div
        className="absolute inset-0"
        style={{ borderRadius: '50%', border: '2px solid rgba(214,178,98,0.5)', boxShadow: '0 0 28px rgba(255,200,80,0.35), inset 0 0 14px rgba(255,200,80,0.1)', animation: 'appRingOuter 14s linear infinite' }}
      >
        {studs}
      </div>

      {/* Second ring — ornamental dots, counter spin */}
      <div className="absolute inset-[8px]" style={{ borderRadius: '50%', animation: 'appRingMid 10s linear infinite' }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${(i / 24) * 360}deg) translateY(-68px)` }}>
            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,215,120,0.7)', transform: 'translate(-50%, -50%)' }} />
          </div>
        ))}
      </div>

      {/* Third ring — dashed gold, forward spin */}
      <div className="absolute inset-[18px]" style={{ borderRadius: '50%', border: '1.5px dashed rgba(255,215,120,0.55)', animation: 'appRingInner 6s linear infinite' }} />

      {/* Fourth ring — solid gold arc, fast counter spin */}
      <div
        className="absolute inset-[28px] rounded-full"
        style={{ border: '2px solid transparent', borderTopColor: 'rgba(255,235,150,0.95)', borderLeftColor: 'rgba(255,215,0,0.4)', boxShadow: '0 0 16px rgba(255,200,80,0.4)', animation: 'appRingMid 4s linear infinite' }}
      />

      {/* Reeded coin edge — rotating ridged ring */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'appCoinEdge 20s linear infinite' }}>
        <div className="relative" style={{ width: '96px', height: '96px' }}>{ridges}</div>
      </div>

      {/* Coin medallion with logo — center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: '80px', height: '80px', border: '3px solid rgba(214,178,98,0.95)', background: 'radial-gradient(circle, rgba(40,28,14,0.98), rgba(14,10,6,1))', animation: 'appCoinGlow 2.2s ease-in-out infinite, appEmblemBreath 3s ease-in-out infinite' }}
        >
          <img src={LOGO_URL} alt="Golden Bounty" className="object-contain" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 6px rgba(255,200,80,0.5))' }} />
        </div>
      </div>
    </div>
  );
}