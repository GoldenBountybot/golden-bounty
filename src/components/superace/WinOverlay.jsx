import React from 'react';

export default function WinOverlay({ floatWin, combo }) {
  return (
    <>
      {combo > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1 z-20 pointer-events-none"
          style={{ animation: 'saComboFlash 0.4s ease-out both' }}
        >
          <span
            className="text-base font-black italic"
            style={{
              color: '#e63946',
              WebkitTextStroke: '1.5px #f5c542',
              textShadow: '0 2px 4px rgba(0,0,0,0.7), 0 0 10px rgba(255,140,40,0.6)',
              fontFamily: 'Rye, Georgia, serif',
              letterSpacing: '0.05em',
            }}
          >
            COMBO {combo}
          </span>
        </div>
      )}
      {floatWin && (
        <div
          key={floatWin.key}
          className="absolute left-1/2 top-1/2 z-20 pointer-events-none"
          style={{ animation: 'saFloatNum 1s ease-out both' }}
        >
          <span
            className="text-5xl font-black tabular-nums"
            style={{
              color: '#fde68a',
              WebkitTextStroke: '2px #b8801e',
              textShadow: '0 3px 8px rgba(0,0,0,0.8), 0 0 18px rgba(255,200,80,0.7)',
              fontFamily: 'Georgia, serif',
            }}
          >
            {floatWin.value.toFixed(2)}
          </span>
        </div>
      )}
    </>
  );
}