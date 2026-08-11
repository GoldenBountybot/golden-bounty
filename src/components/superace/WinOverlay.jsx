import React from 'react';

// Win overlay — JILI Super Ace style.
// COMBO badge floats above, large gold win amount with red outline floats
// directly over the center of the board.
export default function WinOverlay({ floatWin, combo }) {
  return (
    <>
      {/* COMBO / multiplier badge — clearly shows which multiplier round is active */}
      {combo > 1 && floatWin && (
        <div
          key={'combo-' + combo + '-' + floatWin.key}
          className="absolute left-1/2 top-[18%] z-30 pointer-events-none"
          style={{ animation: 'saComboFlash 0.5s ease-out both' }}
        >
          <span
            className="text-2xl font-black italic tabular-nums"
            style={{
              color: '#ffe066',
              WebkitTextStroke: '1.5px #8b1a1a',
              textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 16px rgba(255,140,0,0.7)',
              fontFamily: 'Rye, Georgia, serif',
              whiteSpace: 'nowrap',
            }}
          >
            COMBO ×{combo}
          </span>
        </div>
      )}
      {floatWin && (
        <div
          key={floatWin.key}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          style={{ animation: 'saFloatNum 1s ease-out both' }}
        >
          <span
            className="text-5xl font-black tabular-nums"
            style={{
              color: '#FFD700',
              WebkitTextStroke: '2.5px #c62828',
              textShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,69,0,0.6), 0 0 40px rgba(255,140,0,0.4)',
              fontFamily: 'Georgia, serif',
              fontWeight: 900,
            }}
          >
            {floatWin.value.toFixed(2)}
          </span>
        </div>
      )}
    </>
  );
}