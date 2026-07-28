import React, { useMemo, useRef, useState, useEffect } from 'react';
import SymbolTile from './SymbolTile';
import { randomSymbol } from './symbols';

// A single reel column that smoothly scrolls downward while spinning,
// then snaps to the final symbols when stopped.
function Reel({ reelIndex, rowCount, symbols, spinning, speed, winningPositions, goldFrames, shatteringPositions, cascading, cascadePositions, scatterGlow, anticipationGlow, bulletHit, slow = 1 }) {
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
    // During slow anticipation, scroll a consistent repeating sequence so the
    // symbols cascade smoothly in slow motion. 4 copies make the -75% reelFall
    // loop seamless (bottom copy == top copy), so no chaotic jump is visible.
    if (spinning && anticipationGlow) {
      // 4 blocks where the last matches the first → seamless -75%→0% loop,
      // but the middle two blocks are random so the slow scroll is VISIBLE
      // (4 identical copies made the reel look frozen, not slow-motion).
      const rc = rowCount;
      const block = () => Array.from({ length: rc }, () => randomSymbol());
      const b1 = block();
      return [...b1, ...block(), ...block(), ...b1];
    }
    if (spinning) {
      // 4 blocks where the last matches the first → seamless -75%→0% loop,
      // so the constant-velocity scroll never jumps/flickers at the wrap point.
      const block = () => Array.from({ length: rowCount }, () => randomSymbol());
      const b1 = block();
      return [...b1, ...block(), ...block(), ...b1];
    }
    return symbols;
  }, [spinning, symbols, rowCount, anticipationGlow]);

  return (
    <div className={`relative w-full ${spinning ? 'overflow-hidden' : 'overflow-visible'}`} style={{ aspectRatio: '1 / ' + rowCount }}>
      {/* Anticipation golden edge glow on both sides (brighter) */}
      {anticipationGlow && spinning && (
        <>
          <span
            className="absolute top-0 bottom-0 left-0 w-2 z-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,235,150,0.95) 35%, rgba(255,252,225,1) 50%, rgba(255,235,150,0.95) 65%, rgba(255,215,0,0) 100%)',
              filter: 'blur(1px)',
              boxShadow: '0 0 22px rgba(255,200,80,0.95), 0 0 44px rgba(255,180,50,0.6)',
              mixBlendMode: 'screen',
            }}
          />
          <span
            className="absolute top-0 bottom-0 right-0 w-2 z-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,235,150,0.95) 35%, rgba(255,252,225,1) 50%, rgba(255,235,150,0.95) 65%, rgba(255,215,0,0) 100%)',
              filter: 'blur(1px)',
              boxShadow: '0 0 22px rgba(255,200,80,0.95), 0 0 44px rgba(255,180,50,0.6)',
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}
      <div
        className="flex flex-col w-full"
        style={{ animation: spinning ? `reelFall ${speed}s linear infinite` : justStopped ? (wasAnticipation.current ? 'reelLandSlow 1.1s cubic-bezier(0.22, 1, 0.36, 1)' : 'reelLand 0.42s cubic-bezier(0.22, 1, 0.36, 1)') : 'none', willChange: spinning ? 'transform' : 'auto', transform: spinning ? 'translateZ(0)' : undefined, backfaceVisibility: 'hidden', filter: spinning ? (anticipationGlow ? 'blur(3px) saturate(1.1)' : 'blur(1.5px)') : 'none', transition: 'filter 0.32s ease' }}
      >
        {strip.map((sym, i) => {
          const isDropping = cascading && cascadePositions && cascadePositions.has(`${reelIndex}-${i}`);
          return (
            <div key={i} style={{ width: '100%', aspectRatio: '1 / 1', animation: isDropping ? `cascadeDrop ${(0.45 * slow).toFixed(2)}s ease-out` : 'none', zIndex: isDropping ? 15 : undefined }}>
              <SymbolTile
                symbolId={sym}
                highlighted={!spinning && !cascading && winningPositions.has(`${reelIndex}-${i}`)}
                goldFramed={!spinning && goldFrames.has(`${reelIndex}-${i}`)}
                shattering={!spinning && shatteringPositions && shatteringPositions.has(`${reelIndex}-${i}`)}
                scatterBeam={!spinning && scatterGlow && scatterGlow.has(`${reelIndex}-${i}`)}
                bulletHit={!spinning && bulletHit && bulletHit.has(`${reelIndex}-${i}`)}
                decorFrame={false}
                slow={slow}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(Reel);