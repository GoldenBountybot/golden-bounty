import React from 'react';

const BANNER_URL = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/0435e5ab7_file_0000000056708207b1ac35d409201618.png';

// Ornate "Congratulations — 15 Free Spins" popup. Floats up into the centre
// of the board when 4+ scatters trigger the bonus. Clicking anywhere starts
// the free spins round.
export default function GatesFreeSpinBanner({ onStart }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center"
      onClick={onStart}
      style={{ background: 'rgba(8,2,20,0.78)', cursor: 'pointer' }}>
      <img src={BANNER_URL} alt="Congratulations! 15 Free Spins"
        className="active:scale-95 transition-transform"
        style={{ maxWidth: '92%', maxHeight: '74%', objectFit: 'contain',
          animation: 'gatesBannerFloat 0.55s cubic-bezier(0.2,0.8,0.3,1) both',
          filter: 'drop-shadow(0 0 24px rgba(255,200,80,0.55))' }} />
    </div>
  );
}