import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import SymbolTile from './SymbolTile';
import { randomSymbol } from './symbols';

// A single reel column that smoothly scrolls downward while spinning,
// then snaps to the final symbols when stopped.
function Reel({ reelIndex, rowCount, symbols, finalSymbols, spinning, speed, winningPositions, goldFrames, shatteringPositions, cascading, cascadePositions, scatterGlow, anticipationGlow, bulletHit, slow = 1 }) {
  const [justStopped, setJustStopped] = useState(false);
  const prevSpinning = useRef(false);
  const wasAnticipation = useRef(false);

  useEffect(() => { if (spinning && anticipationGlow) wasAnticipation.current = true; }, [spinning, anticipationGlow]);

  // useLayoutEffect — sets justStopped BEFORE the browser paints, so there's
  // no one-frame gap where the reel shows static (stuck) symbols between the
  // spin animation ending and the land animation starting.
  useLayoutEffect(() => {
    if (prevSpinning.current && !spinning) {
      setJustStopped(true);
      const t = setTimeout(() => { setJustStopped(false); wasAnticipation.current = false; }, wasAnticipation.current ? 1100 : 400);
      prevSpinning.current = spinning;
      return () => clearTimeout(t);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const strip = useMemo(() => {
    // During slow anticipation, show the FINAL symbols descending smoothly
    // from above into their landing positions (a single glide, not a random
    // loop) so the user sees exactly which symbol will stick — no confusing
    // snap to a different symbol when the reel stops.
    if (spinning && anticipationGlow) {
      const filler = Array.from({ length: rowCount }, () => randomSymbol());
      return [...(finalSymbols || symbols), ...filler];
    }
    if (spinning) {
      // First & last blocks identical → seamless -75%→0% reelFall loop (no jump).
      const block = () => Array.from({ length: rowCount }, () => randomSymbol());
      const b1 = block();
      return [...b1, ...block(), ...block(), ...b1];
    }
    return symbols;
  }, [spinning, symbols, finalSymbols, rowCount, anticipationGlow]);

  return (
    <div className={`relative w-full ${spinning ? 'overflow-hidden' : 'overflow-visible'}`} style={{ aspectRatio: '1 / ' + rowCount, contain: 'layout style', transform: 'translate3d(0,0,0)' }}>
      {/* Anticipation golden border glow — intense vertical beams on both
          sides of the reel with massive bloom that floods adjacent reel lines */}
      {anticipationGlow && spinning && (
        <>
          <span
            className="absolute top-0 bottom-0 left-0 z-40 pointer-events-none"
            style={{
              width: '5px',
              transform: 'translateX(-2.5px)',
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,252,210,1) 20%, rgba(255,255,255,1) 50%, rgba(255,252,210,1) 80%, rgba(255,215,0,0) 100%)',
              boxShadow: '0 0 18px rgba(255,255,240,1), 0 0 40px rgba(255,235,130,1), 0 0 78px rgba(255,215,80,1), 0 0 130px rgba(255,200,50,0.95), 0 0 190px rgba(255,185,30,0.6)',
              mixBlendMode: 'screen',
            }}
          />
          <span
            className="absolute top-0 bottom-0 right-0 z-40 pointer-events-none"
            style={{
              width: '5px',
              transform: 'translateX(2.5px)',
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,252,210,1) 20%, rgba(255,255,255,1) 50%, rgba(255,252,210,1) 80%, rgba(255,215,0,0) 100%)',
              boxShadow: '0 0 18px rgba(255,255,240,1), 0 0 40px rgba(255,235,130,1), 0 0 78px rgba(255,215,80,1), 0 0 130px rgba(255,200,50,0.95), 0 0 190px rgba(255,185,30,0.6)',
              mixBlendMode: 'screen',
            }}
          />
          {/* Spillover flood — wide diffused golden glow (wild-halo style) that
              bleeds well past the reel edges onto neighbouring reel lines */}
          <span
            className="absolute z-30 pointer-events-none"
            style={{
              top: '-50%', bottom: '-50%', left: '-70%', right: '-70%',
              background: 'radial-gradient(circle at center, rgba(255,250,225,0.55) 0%, rgba(255,225,120,0.38) 30%, rgba(255,195,70,0.18) 55%, transparent 82%)',
              filter: 'blur(5px)',
              mixBlendMode: 'screen',
              animation: 'wildHaloPulse 2.4s ease-in-out infinite',
            }}
          />
        </>
      )}
      <div
        className="flex flex-col w-full"
        style={{ animation: spinning ? (anticipationGlow ? `wbSlowDescent ${speed}s linear forwards` : `reelFall ${speed}s linear infinite`) : justStopped ? (wasAnticipation.current ? 'reelLandSlow 1.1s cubic-bezier(0.16, 1, 0.3, 1)' : 'reelLand 0.4s cubic-bezier(0.16, 1, 0.3, 1)') : 'none', willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' }}
      >
        {strip.map((sym, i) => {
          const isDropping = cascading && cascadePositions && cascadePositions.has(`${reelIndex}-${i}`);
          return (
            <div key={i} style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', animation: isDropping ? `wbDrop ${(0.42 * slow).toFixed(2)}s cubic-bezier(0.16, 1, 0.3, 1)` : 'none', willChange: isDropping ? 'transform, opacity' : 'auto', zIndex: isDropping ? 15 : (!spinning && (sym === 'wild' || sym === 'scatter') ? 18 : undefined) }}>
              <SymbolTile
                symbolId={sym}
                spinning={spinning}
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