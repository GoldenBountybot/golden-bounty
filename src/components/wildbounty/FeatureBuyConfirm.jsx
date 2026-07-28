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
            className="wb-deep-gold text-4xl italic leading-none"
            style={{ fontFamily: 'Rye, Georgia, serif' }}
          >
            {cost.toFixed(2)}
          </span>
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