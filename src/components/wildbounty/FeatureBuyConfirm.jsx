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
      <div className="relative w-full max-w-md select-none" style={{ aspectRatio: '3 / 4' }}>
        {/* Panel artwork */}
        <img
          src={PANEL_URL}
          alt="Feature Buy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.7))' }}
        />

        {/* Dynamic cost value — sits inside the dark COST plaque */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ top: '34%', height: '12%', zIndex: 5 }}
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

        {/* CANCEL click zone (bottom-left button) */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="absolute cursor-pointer"
          style={{ left: '6%', right: '52%', top: '82%', bottom: '4%', zIndex: 20 }}
        />
        {/* START click zone (bottom-right button) */}
        <button
          type="button"
          onClick={onStart}
          aria-label="Start"
          className="absolute cursor-pointer"
          style={{ left: '52%', right: '6%', top: '82%', bottom: '4%', zIndex: 20 }}
        />
      </div>
    </div>
  );
}