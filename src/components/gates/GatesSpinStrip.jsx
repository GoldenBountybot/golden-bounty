import React from 'react';
import { SYM_IMG } from './GatesSymbol';

// Normal symbol keys used for the spinning reel strip visual.
const STRIP_KEYS = ['zeus', 'crown', 'hourglass', 'ring', 'goblet', 'red', 'blue', 'green', 'yellow'];
const randSym = () => STRIP_KEYS[Math.floor(Math.random() * STRIP_KEYS.length)];

// Scrolling reel strip shown while a reel is spinning (Big Brown style).
// The strip is built from 5-row blocks where the last block equals the first,
// so the reelFall -75%→0% loop is seamless. Blurred for a motion feel.
export default React.memo(function GatesSpinStrip({ turbo }) {
  const strip = React.useMemo(() => {
    const block = () => Array.from({ length: 5 }, randSym);
    const b = block();
    return [...b, ...block(), ...block(), ...b];
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[5px] pointer-events-none"
      style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
    >
      <div
        className="flex flex-col gap-[3px] w-full"
        style={{
          animation: `reelFall ${turbo ? 0.32 : 0.45}s linear infinite`,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {strip.map((s, i) => {
          const img = SYM_IMG[s];
          return (
            <div key={i} className="rounded-[5px] overflow-hidden" style={{ aspectRatio: '1 / 0.82', background: 'transparent' }}>
              {img && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: `url(${img})`,
                    maskImage: `url(${img})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskMode: 'luminance',
                    maskMode: 'luminance',
                    filter: 'blur(1.1px) brightness(0.8)',
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