import React from 'react';
import { SYM_IMG } from './GatesSymbol';

// Normal symbol keys used for the spinning reel strip visual.
const STRIP_KEYS = ['zeus', 'crown', 'hourglass', 'ring', 'goblet', 'red', 'blue', 'green', 'yellow'];
const randSym = () => STRIP_KEYS[Math.floor(Math.random() * STRIP_KEYS.length)];

// Dark backdrop painted inside the strip's own (transform-isolated) stacking
// context so that `mix-blend-mode: screen` has a non-black backdrop to remove
// the pure-black symbol background against — independent of the page behind.
// Transparent so the board's purple background shows through unchanged while
// the reel spins — the background stays identical in both idle and spin states.
const STRIP_BG = 'transparent';

// Scrolling reel strip shown while a reel is spinning.
// The strip is built from 5-row blocks where the last block equals the first,
// so the reelFall -75%→0% loop is seamless. screen blend over the strip's own
// dark bg removes each symbol's black background while keeping its colours.
export default React.memo(function GatesSpinStrip({ turbo }) {
  const strip = React.useMemo(() => {
    const block = () => Array.from({ length: 5 }, randSym);
    const b = block();
    return [...b, ...block(), ...block(), ...b];
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[5px] pointer-events-none"
      style={{ background: STRIP_BG }}
    >
      <div
        className="flex flex-col gap-[6px] w-full relative"
        style={{
          animation: `reelFall ${turbo ? 0.32 : 0.45}s linear infinite`,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          background: STRIP_BG,
        }}
      >
        {strip.map((s, i) => {
          const img = SYM_IMG[s];
          return (
            <div key={i} className="rounded-[5px] overflow-hidden" style={{ aspectRatio: '1 / 0.82' }}>
              {img && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: `url(${img})`,
                    WebkitMaskSize: 'cover',
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    maskImage: `url(${img})`,
                    maskSize: 'cover',
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    maskMode: 'luminance',
                    WebkitMaskSourceType: 'luminance',
                    filter: 'brightness(1.12) saturate(1.5) contrast(1.14)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});