import React from 'react';

const W = { fontFamily: 'Rye, Georgia, serif' };

export default function MultiplierBar({ mults, combo, inFree, freeSpinsLeft }) {
  const active = Math.min(combo - 1, mults.length - 1);
  return (
    <div className="flex flex-col items-center gap-1">
      {inFree && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-black tracking-wider" style={{ color: '#f5c542', ...W, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>FREE SPIN</span>
          <span className="text-2xl font-black tabular-nums leading-none" style={{ color: '#ff8c2e', fontFamily: 'Georgia, serif', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{freeSpinsLeft}</span>
        </div>
      )}
      <div
        className="inline-flex items-stretch gap-1 rounded-full px-2 py-1"
        style={{
          background: 'linear-gradient(to bottom, #5a1410, #8a1c14)',
          border: '1px solid rgba(245,197,66,0.7)',
          boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.4), 0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        {mults.map((m, i) => (
          <span
            key={i}
            className="px-2.5 py-0.5 rounded-full text-sm font-black tabular-nums"
            style={
              i === active && combo > 0
                ? {
                    background: 'radial-gradient(circle, #ffe98a, #f5c542)',
                    color: '#5a1010',
                    boxShadow: '0 0 10px rgba(255,200,80,0.9), inset 0 1px 0 rgba(255,255,255,0.6)',
                    animation: 'saMultGlow 0.9s ease-in-out infinite',
                    ...W,
                  }
                : { color: 'rgba(255,235,180,0.5)', ...W }
            }
          >
            ×{m}
          </span>
        ))}
      </div>
    </div>
  );
}