import React, { useRef, useEffect } from 'react';

// A golden multiplier chip that flies from an origin offset into the tumble
// win banner, representing a value symbol's multiplier (or the accumulated
// banner multiplier) flying in to multiply the win amount.
// `value`  — the multiplier number (rendered as ×N)
// `ox/oy`  — origin offset from the banner centre (px); chip starts there
// `from`   — 'symbol' (flies up from the board) | 'banner' (flies from the
//            total-multiplier banner on the side)
//
// Uses the Web Animations API with LITERAL transform values (no CSS custom
// properties inside the keyframes). CSS vars in an animated `transform`
// force the browser off the GPU compositor onto the main thread, which
// stuttered when several chips flew at once. Literal values composite on
// the GPU for a smooth, jank-free flight.
export default function GatesMultFly({ value, ox = 0, oy = 100, lx = 55, from = 'symbol' }) {
  const ref = useRef(null);
  const color = from === 'banner' ? '#b0e0ff' : '#fff8c0';
  const stroke = from === 'banner' ? '#0a2a4a' : '#5a3a0c';
  const glow =
    from === 'banner'
      ? '0 0 16px rgba(120,200,255,1), 0 0 28px rgba(80,160,255,0.85), 0 2px 3px rgba(0,0,0,0.9)'
      : '0 0 16px rgba(255,200,0,1), 0 0 28px rgba(255,160,0,0.85), 0 2px 3px rgba(0,0,0,0.9)';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = el.animate(
      [
        { transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) scale(0.7) rotate(-5deg)`, opacity: 0 },
        { transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) scale(0.7) rotate(-5deg)`, opacity: 1, offset: 0.12 },
        { transform: `translate(calc(-50% + ${lx}px), -50%) scale(1.18) rotate(2deg)`, opacity: 1, offset: 0.82 },
        { transform: `translate(calc(-50% + ${lx}px), -50%) scale(1) rotate(0deg)`, opacity: 1 },
      ],
      { duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
    );
    return () => anim.cancel();
  }, [ox, oy, lx]);

  return (
    <span
      ref={ref}
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: '50%',
        fontFamily: 'Georgia,serif',
        fontWeight: 900,
        fontSize: 26,
        color,
        textShadow: glow,
        WebkitTextStroke: `0.5px ${stroke}`,
        zIndex: 60,
        whiteSpace: 'nowrap',
        willChange: 'transform, opacity',
        transform: 'translate(-50%, -50%)',
      }}
    >
      ×{value}
    </span>
  );
}