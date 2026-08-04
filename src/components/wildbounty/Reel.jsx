import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import SymbolTile from './SymbolTile';
import { randomSymbol } from './symbols';

// A single reel column that smoothly scrolls downward while spinning,
// then snaps to the final symbols when stopped.
function Reel({ reelIndex, rowCount, symbols, spinning, speed, winningPositions, goldFrames, shatteringPositions, cascading, cascadePositions, scatterGlow, anticipationGlow, bulletHit, slow = 1 }) {
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
      // First & last blocks identical → seamless -75%→0% reelFall loop (no jump).
      const block = () => Array.from({ length: rowCount }, () => randomSymbol());
      const b1 = block();
      return [...b1, ...block(), ...block(), ...b1];
    }
    return symbols;
  }, [spinning, symbols, rowCount, anticipationGlow]);

  return (
    <div className={`relative w-full ${spinning ? 'overflow-hidden' : 'overflow-visible'}`} style={{ aspectRatio: '1 / ' + rowCount, contain: 'layout style', transform: 'translate3d(0,0,0)' }}>
      {/* Anticipation golden border glow — bright vertical beams on both
          sides of the reel with heavy bloom that spills onto adjacent reels */}
      {anticipationGlow && spinning && (
        <>
          <span
            className="absolute top-0 bottom-0 left-0 z-40 pointer-events-none"
            style={{
              width: '3px',
              transform: 'translateX(-1.5px)',
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,245,180,1) 30%, rgba(255,255,240,1) 50%, rgba(255,245,180,1) 70%, rgba(255,215,0,0) 100%)',
              boxShadow: '0 0 10px rgba(255,255,220,1), 0 0 24px rgba(255,220,100,1), 0 0 48px rgba(255,200,60,0.85), 0 0 80px rgba(255,180,40,0.5)',
              mixBlendMode: 'screen',
            }}
          />
          <span
            className="absolute top-0 bottom-0 right-0 z-40 pointer-events-none"
            style={{
              width: '3px',
              transform: 'translateX(1.5px)',
              background: 'linear-gradient(to top, rgba(255,215,0,0) 0%, rgba(255,245,180,1) 30%, rgba(255,255,240,1) 50%, rgba(255,245,180,1) 70%, rgba(255,215,0,0) 100%)',
              boxShadow: '0 0 10px rgba(255,255,220,1), 0 0 24px rgba(255,220,100,1), 0 0 48px rgba(255,200,60,0.85), 0 0 80px rgba(255,180,40,0.5)',
              mixBlendMode: 'screen',
            }}
          />
          {/* Spillover halo — soft diffused glow covering the reel area that
              bleeds onto adjacent reels for the bloom effect */}
          <span
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,220,120,0.18) 0%, rgba(255,200,80,0.08) 50%, transparent 80%)',
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}
      <div
        className="flex flex-col w-full"
        style={{ animation: spinning ? `reelFall ${speed}s linear infinite` : justStopped ? (wasAnticipation.current ? 'reelLandSlow 1.1s cubic-bezier(0.16, 1, 0.3, 1)' : 'reelLand 0.4s cubic-bezier(0.16, 1, 0.3, 1)') : 'none', willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' }}
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