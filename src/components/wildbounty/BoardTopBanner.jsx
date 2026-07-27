import React, { useEffect, useRef, useState } from 'react';

// Hanging "bull-skull + gold-frame wooden sign" banner mounted on top of the
// reel board. The source asset ships on a solid #000000 background with a
// faint dark halo around the art. CSS/SVG luminance keys cannot cleanly
// separate that dark halo from the dark-brown wood (#4A2D1B), so a residual
// "black shadow" always remains.
//
// Instead we process the image pixel-by-pixel on a <canvas>: any pixel whose
// maximum channel value is below BG_THRESHOLD is treated as background and
// made fully transparent; everything else keeps its exact RGB. The darkest
// wood (#4A2D1B → max channel 74) sits far above the threshold (26), so all
// art stays opaque and untouched while pure black + halo vanish.

const BANNER_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/34377a521_file_00000000ce28820b9b425fc57f1c795e.png';

// Chroma + value key. The source art sits on solid black, but compression
// leaves a grey halo around it whose luminance overlaps the dark-brown wood
// (#4A2D1B) — so a pure luminance cut cannot separate them.
//
// Instead we key by colourfulness: pixels that are both dark AND nearly grey
// (low saturation) are background/halo → alpha 0. The dark wood is dark but
// highly saturated (R≠G≠B), so it stays fully opaque. Bright low-saturation
// pixels (metal highlights) are kept via the value ceiling.
const BG_VALUE_FLOOR = 26;   // pure/near-black → always transparent
const SAT_FLOOR = 0.16;       // (max-min)/max below this = greyish
const GREY_VALUE_CEIL = 132;  // only treat as halo if also darker than this

export default function BoardTopBanner({ className = '' }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
          const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
          if (max < BG_VALUE_FLOOR) {
            px[i + 3] = 0; // pure black background
          } else {
            const sat = max === 0 ? 0 : (max - min) / max;
            if (sat < SAT_FLOOR && max < GREY_VALUE_CEIL) {
              px[i + 3] = 0; // grey halo (dark + desaturated)
            }
          }
        }
        ctx.putImageData(data, 0, 0);
        if (!cancelled) setSrc(canvas.toDataURL('image/png'));
      } catch (e) {
        // Canvas tainted (CORS) — fall back to the raw image with screen blend.
        if (!cancelled) setError(true);
      }
    };
    img.onerror = () => !cancelled && setError(true);
    img.src = BANNER_IMG;
    return () => { cancelled = true; };
  }, []);

  // Fallback: if canvas processing fails (e.g. CORS taint), use screen blend.
  if (error) {
    return (
      <div className={`relative w-full mx-auto ${className}`}>
        <img
          src={BANNER_IMG}
          alt=""
          className="block w-full h-auto select-none"
          draggable={false}
          style={{ mixBlendMode: 'screen', filter: 'brightness(1.1) contrast(1.8) saturate(1.5)' }}
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full mx-auto ${className}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className="block w-full h-auto select-none"
          draggable={false}
          style={{ filter: 'saturate(1.55) contrast(1.18) brightness(1.12)' }}
        />
      ) : (
        <div className="w-full aspect-[3/1]" />
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}