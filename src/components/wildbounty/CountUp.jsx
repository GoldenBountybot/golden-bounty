import React, { useEffect, useRef } from 'react';

// Animates a number counting up from its previous value to the new target,
// used in the win banner so the win amount visibly multiplies up cascade by
// cascade instead of snapping to the new total.
//
// Uses a ref + direct DOM textContent update instead of state so the 60fps
// animation never triggers React re-renders (which would cascade up to the
// whole machine and cause jank during the showdown sequence).
export default function CountUp({ value = 0, duration = 650, decimals = 2 }) {
  const spanRef = useRef(null);
  const fromRef = useRef(0);
  const rafRef = useRef();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      if (spanRef.current) spanRef.current.textContent = to.toFixed(decimals);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      if (spanRef.current) spanRef.current.textContent = val.toFixed(decimals);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span ref={spanRef} style={{ fontVariantNumeric: 'tabular-nums' }}>{fromRef.current.toFixed(decimals)}</span>;
}