import React, { useMemo, useRef, useState, useEffect } from 'react';
import SymbolTile from './SymbolTile';
import { randomSymbol } from './symbols';

// A single reel column that smoothly scrolls downward while spinning,
// then snaps to the final symbols when stopped.
export default function Reel({ reelIndex, rowCount, symbols, spinning, speed, winningPositions, goldFrames, shatteringPositions, cascading, cascadePositions, scatterGlow, anticipationGlow }) {
  const [justStopped, setJustStopped] = useState(false);
  const prevSpinning = useRef(false);
  const wasAnticipation = useRef(false);

  useEffect(() => { if (spinning && anticipationGlow) wasAnticipation.current = true; }, [spinning, anticipationGlow]);

  useEffect(() => {
    if (prevSpinning.current && !spinning) {
      setJustStopped(true);
      const t = setTimeout(() => { setJustStopped(false); wasAnticipation.current = false; }, wasAnticipation.current ? 1100 : 400);
      prevSpinning.current = spinning;
      return () => clearTimeout(t);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const strip = useMemo(() => {
    if (spinning) return Array.from({ length: rowCount * 6 }, () => randomSymbol());
    return symbols;
  }, [spinning, symbols, rowCount]);

  return (
    <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: '1 / ' + rowCount }}>
      {/* Anticipation golden edge glow on both sides */}
      {anticipationGlow && spinning && (
        <>
          <span
            className="absolute top-0 bottom-0 left-0 w-1.5 z-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,225,120,0.7) 40%, rgba(255,250,200,0.95) 50%, rgba(255,225,120,0.7) 60%, rgba(255,215,0,0) 100%)',
              filter: 'blur(1.5px)',
              boxShadow: '0 0 12px rgba(255,200,80,0.6)',
              mixBlendMode: 'screen',
            }}
          />
          <span
            className="absolute top-0 bottom-0 right-0 w-1.5 z-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,225,120,0.7) 40%, rgba(255,250,200,0.95) 50%, rgba(255,225,120,0.7) 60%, rgba(255,215,0,0) 100%)',
              filter: 'blur(1.5px)',
              boxShadow: '0 0 12px rgba(255,200,80,0.6)',
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}
      <div
        className="flex flex-col w-full"
        style={{
          animation: spinning ? `reelFall ${speed}s linear infinite` : justStopped ? (wasAnticipation.current ? 'reelLandSlow 1.1s ease-out' : 'reelLand 0.4s ease-out') : 'none',
          // Slow anticipation makes individual symbols too distinct / chaotic —
          // add a vertical motion blur so it reads as a smooth slow spin.
          filter: spinning && anticipationGlow ? 'blur(3.5px)' : spinning ? 'blur(1.5px)' : 'none',
        }}
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
                scatterBeam={!spinning && scatterGlow && scatterGlow.has(`${reelIndex}-${i}`)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}