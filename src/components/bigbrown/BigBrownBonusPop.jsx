import React, { useState } from 'react';
import { SYMBOLS } from '@/lib/bigBrownEngine';

const fmt = (v) => `$${v.toFixed(2)}`;

// BONUS POP — circular gold emblem with red price badge + an overlay menu
// offering 8/12/16/24 free games. The menu floats over the reel board.
export default function BigBrownBonusPop({ balance, bonusCost, bonusCosts, buyBonus, spinning, freeSpins }) {
  const [showBonusMenu, setShowBonusMenu] = useState(false);
  const disabled = spinning || freeSpins > 0;

  return (
    <div className="relative z-30 flex justify-end pr-4 mt-1 mb-2">
      <div
        onClick={() => { if (!disabled) setShowBonusMenu(s => !s); }}
        className={`relative flex flex-col items-center cursor-pointer transition-transform active:scale-95 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {/* Circular golden emblem */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 62,
            height: 62,
            padding: 4,
            background: 'radial-gradient(circle at 35% 30%, #fff2c0 0%, #f5c542 35%, #c8881e 70%, #8b5a2b 100%)',
            boxShadow: '0 0 12px rgba(255,200,80,0.45), inset 0 2px 3px rgba(255,250,200,0.6), inset 0 -3px 5px rgba(90,58,20,0.7), 0 3px 10px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="relative rounded-full flex flex-col items-center justify-center overflow-hidden"
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 40% 30%, #ffe9a8 0%, #f5c542 45%, #c8881e 85%, #a86a1e 100%)',
              border: '1.5px solid rgba(255,234,160,0.85)',
              boxShadow: 'inset 0 -2px 4px rgba(120,80,20,0.7), inset 0 2px 3px rgba(255,250,200,0.45)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-conic-gradient(from 0deg, rgba(120,80,20,0.18) 0deg, transparent 8deg, rgba(120,80,20,0.18) 16deg)',
                opacity: 0.5,
              }}
            />
            <span
              className="relative text-[10px] font-black italic leading-none tracking-wide"
              style={{ fontFamily: 'Rye, Georgia, serif', color: '#fff7d6', textShadow: '0 1px 0 #8b5a2b, 0 2px 2px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,245,200,0.4)' }}
            >
              BONUS
            </span>
            <span
              className="relative text-[10px] font-black italic leading-none tracking-wide mt-0.5"
              style={{ fontFamily: 'Rye, Georgia, serif', color: '#fff7d6', textShadow: '0 1px 0 #8b5a2b, 0 2px 2px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,245,200,0.4)' }}
            >
              POP
            </span>
          </div>
        </div>

        {/* Red price badge */}
        <div
          className="relative -mt-1.5 z-10 rounded-full px-2.5 py-0.5"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #e8321a, #c21807 55%, #8b0000 100%)',
            border: '1.5px solid rgba(255,180,150,0.7)',
            boxShadow: '0 0 8px rgba(194,24,7,0.7), inset 0 1px 1px rgba(255,200,180,0.4), inset 0 -1px 2px rgba(80,0,0,0.6)',
          }}
        >
          <span
            className="text-[10px] font-black leading-none tabular-nums"
            style={{ fontFamily: 'Georgia, serif', color: '#fff', textShadow: '0 1px 1px rgba(80,0,0,0.8)' }}
          >
            {fmt(bonusCost)}
          </span>
        </div>
      </div>

      {/* Bonus menu — 8/12/16/24 free spin offers (overlay over the board) */}
      {showBonusMenu && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-50 w-[300px] rounded-[14px] p-2.5 grid grid-cols-2 gap-2"
          style={{
            top: 'calc(100% + 8px)',
            background: 'radial-gradient(ellipse at center, rgba(15,22,40,0.97), rgba(2,8,20,0.98))',
            border: '1.5px solid rgba(214,178,98,0.55)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.75), inset 0 0 18px rgba(0,0,0,0.6)',
          }}
        >
          {Object.entries(bonusCosts).map(([games, cost]) => {
            const canAfford = balance >= cost;
            return (
              <button
                key={games}
                onClick={() => { if (canAfford) { buyBonus(Number(games)); setShowBonusMenu(false); } }}
                disabled={!canAfford}
                className="relative rounded-[10px] p-2 flex flex-col items-center gap-1 disabled:opacity-40 transition-transform active:scale-95"
                style={{
                  border: '1px solid rgba(214,178,98,0.3)',
                  background: 'linear-gradient(160deg, rgba(30,42,70,0.7), rgba(8,16,32,0.7))',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Big golden number — padded so italic glyphs aren't clipped */}
                <span
                  className="inline-block text-[24px] font-black italic leading-none"
                  style={{
                    fontFamily: 'Rye, Georgia, serif',
                    padding: '0 6px',
                    overflow: 'visible',
                    background: 'linear-gradient(to bottom, #fff7d6 0%, #ffe9a8 22%, #f5c542 50%, #c8881e 80%, #8b5a2b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 1px 0 #6b4a1a) drop-shadow(0 2px 2px rgba(0,0,0,0.7))',
                  }}
                >
                  {games}
                </span>

                {/* FREE GAMES gold pill */}
                <span
                  className="px-2 py-0.5 rounded-full text-[8px] font-black italic leading-none tracking-wide"
                  style={{
                    fontFamily: 'Georgia, serif',
                    color: '#3a2408',
                    background: 'linear-gradient(to bottom, #fff7d6, #ffe9a8 30%, #f5c542 65%, #c8881e)',
                    border: '1px solid rgba(255,234,160,0.8)',
                    boxShadow: 'inset 0 -1px 2px rgba(120,80,20,0.5), inset 0 1px 1px rgba(255,250,200,0.5)',
                  }}
                >
                  FREE GAMES
                </span>

                {/* Bear wild symbol — dark background, no white bleed */}
                <div
                  className="w-12 h-14 rounded-[5px] overflow-hidden flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(160deg,#2a1c0c,#0a0603)',
                    border: '1px solid rgba(214,178,98,0.4)',
                  }}
                >
                  <img
                    src={SYMBOLS.brown.img}
                    alt="WILD"
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(1.1) saturate(1.05) drop-shadow(0 0 3px rgba(255,200,80,0.5))' }}
                    draggable={false}
                  />
                </div>

                {/* WILD — flat text label, NOT a button */}
                <span
                  className="text-[9px] font-black italic tracking-[0.18em] leading-none"
                  style={{
                    fontFamily: 'Rye, Georgia, serif',
                    color: '#ffe9a8',
                    textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                  }}
                >
                  WILD
                </span>

                {/* Price */}
                <span
                  className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black leading-none tabular-nums"
                  style={{
                    fontFamily: 'Georgia, serif',
                    color: '#fff',
                    background: 'radial-gradient(circle at 35% 30%, #e8321a, #c21807 55%, #8b0000)',
                    border: '1px solid rgba(255,180,150,0.6)',
                    boxShadow: '0 0 6px rgba(194,24,7,0.5)',
                  }}
                >
                  {fmt(cost)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}