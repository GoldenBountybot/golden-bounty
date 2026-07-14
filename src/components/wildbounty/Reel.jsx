import React, { useMemo, useRef, useState, useEffect } from 'react';
import SymbolTile from './SymbolTile';
import { randomSymbol } from './symbols';

// A single reel column that smoothly scrolls downward while spinning,
// then snaps to the final symbols when stopped.
export default function Reel({ reelIndex, rowCount, symbols, spinning, speed, winningPositions, goldFrames, shatteringPositions, cascading, cascadePositions }) {
  const [justStopped, setJustStopped] = useState(false);
  const prevSpinning = useRef(false);

  useEffect(() => {
    if (prevSpinning.current && !spinning) {
      setJustStopped(true);
      const t = setTimeout(() => setJustStopped(false), 400);
      prevSpinning.current = spinning;
      return () => clearTimeout(t);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const strip = useMemo(() => {
    if (spinning) return Array.from({ length: rowCount * 4 }, () => randomSymbol());
    return symbols;
  }, [spinning, symbols, rowCount]);

  return (
    <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: '1 / ' + rowCount }}>
      <div
        className="flex flex-col w-full"
        style={{ animation: spinning ? `reelFall ${speed}s linear infinite` : justStopped ? 'reelLand 0.4s ease-out' : 'none' }}
      >
        {strip.map((sym, i) => {
          const isDropping = cascading && cascadePositions && cascadePositions.has(`${reelIndex}-${i}`);
          return (
            <div key={i} style={{ width: '100%', aspectRatio: '1 / 1', animation: isDropping ? 'cascadeDrop 0.45s ease-out' : 'none', zIndex: isDropping ? 15 : undefined }}>
              <SymbolTile
                symbolId={sym}
                highlighted={!spinning && !cascading && winningPositions.has(`${reelIndex}-${i}`)}
                goldFramed={!spinning && goldFrames.has(`${reelIndex}-${i}`)}
                shattering={!spinning && shatteringPositions && shatteringPositions.has(`${reelIndex}-${i}`)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}