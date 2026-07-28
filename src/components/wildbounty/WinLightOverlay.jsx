import React from 'react';
import { REEL_ROWS } from './symbols';

// Golden light-burst overlay drawn ABOVE the whole reel grid so the flare can
// bleed into neighbouring cells without being clipped by a reel column or
// covered by a sibling reel's symbols.
//
// Cell geometry (diamond 3-4-5-5-4-3 grid, cells are square, reels vertically
// centered):
//   cellW = 100% / 6  (of grid width)
//   cellH = 100% / 5  (of grid height)  — equal in px because gridH = 5/6 gridW
//   x% = (reel + 0.5) * cellW%
//   y% = (centerOffsetCells + row + 0.5) * cellH%   where centerOffsetCells = (5 - rows)/2

const WIN_LIGHT_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bc304a051_file_0000000019b081faa7b2dd0cdc894459.png';

function lightFor(pos, grid) {
  const [ri, row] = pos.split('-').map(Number);
  const rows = REEL_ROWS[ri] || 5;
  const sym = grid[ri] ? grid[ri][row] : '';
  const isWild = sym === 'wild';
  const scale = isWild ? 2.35 : 1.95;
  return {
    left: `${(ri + 0.5) * (100 / 6)}%`,
    top: `${((5 - rows) / 2 + row + 0.5) * 20}%`,
    width: `${scale * (100 / 6)}%`,
    height: `${scale * 20}%`,
    '--wl-peak': isWild ? 2.35 : 1.95,
    '--wl-settle': isWild ? 2.2 : 1.82,
    key: pos,
  };
}

export default function WinLightOverlay({ winningPositions, grid }) {
  if (!winningPositions || winningPositions.size === 0) return null;
  const positions = [...winningPositions];
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, mixBlendMode: 'screen' }}>
      {positions.map(pos => {
        const s = lightFor(pos, grid);
        return (
          <img
            key={s.key}
            src={WIN_LIGHT_URL}
            alt=""
            draggable={false}
            className="absolute object-cover"
            style={{
              left: s.left,
              top: s.top,
              width: s.width,
              height: s.height,
              transform: 'translate(-50%, -50%)',
              transformOrigin: 'center center',
              mixBlendMode: 'screen',
              animation: 'winLightBurst 0.5s ease-out forwards',
              '--wl-peak': s['--wl-peak'],
              '--wl-settle': s['--wl-settle'],
            }}
          />
        );
      })}
    </div>
  );
}