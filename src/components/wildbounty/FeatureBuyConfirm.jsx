import React from 'react';

// Confirmation modal shown when the player taps the Feature Buy banner.
// The full artwork (title, COST plaque, instructions, buttons) is a single
// uploaded image; we overlay the dynamic cost value and invisible click
// zones over CANCEL / START so the artwork stays pixel-perfect.
// START awards 10 free spins; CANCEL returns to the board.
const PANEL_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ed1ba82bf_file_00000000de4c8230a7b6890bc5104bb2.png';

export default function FeatureBuyConfirm({ cost, onStart, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(3px)' }}
    >
      <div className="relative w-full max-w-sm select-none" style={{ pointerEvents: 'auto' }}>
        {/* Panel artwork — in flow so it defines the box the buttons map to */}
        <img
          src={PANEL_URL}
          alt="Feature Buy"
          draggable={false}
          className="block w-full h-auto"
          style={{ filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.7))', pointerEvents: 'none' }}
        />

        {/* Dynamic cost value — sits inside the dark COST plaque */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ top: '33%', height: '13%', zIndex: 5 }}
        >
          <span
            className="text-4xl font-black italic leading-none"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              color: '#f0cf6a',
              WebkitTextStroke: '1px #2a1a08',
              textShadow:
                '0 1px 0 rgba(255,250,210,0.55), 0 2px 1px rgba(0,0,0,0.55), 0 3px 3px rgba(0,0,0,0.5)',
            }}
          >
            {cost.toFixed(2)}
          </span>
        </div>

        {/* Instruction text under COST — Rye font, bright gold on dark band */}
        <div
          className="absolute left-0 right-0 flex flex-col items-center justify-center text-center px-[8%] pointer-events-none"
          style={{ top: '48%', height: '26%', zIndex: 7 }}
        >
          <div
            style={{
              background: 'rgba(40,24,8,0.82)',
              borderRadius: '10px',
              padding: '8px 12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            <p
              className="text-[13px] leading-snug italic"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                color: '#ffd54a',
                WebkitTextStroke: '0.6px #2a1a08',
                textShadow:
                  '0 1px 0 rgba(0,0,0,0.8), 0 0 8px rgba(255,200,60,0.55)',
                letterSpacing: '0.03em',
              }}
            >
              SELECT &lsquo;START&rsquo; TO TRIGGER THE FREE SPINS FEATURE AT THE CURRENT BET SIZE &amp; BET LEVEL
            </p>
          </div>
        </div>

        {/* Hidden CANCEL button — sits over the CANCEL button artwork */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="absolute"
          style={{
            left: '4%', width: '45%',
            top: '76%', height: '20%',
            zIndex: 30,
            pointerEvents: 'auto',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        />
        {/* Hidden START button — sits over the START button artwork */}
        <button
          type="button"
          onClick={onStart}
          aria-label="Start"
          className="absolute"
          style={{
            left: '51%', width: '45%',
            top: '76%', height: '20%',
            zIndex: 30,
            pointerEvents: 'auto',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}