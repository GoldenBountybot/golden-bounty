import React, { useEffect, useRef } from 'react';

// Animates a number counting up from its previous value to the new target,
// used in the win banner so the win amount visibly multiplies up cascade by
// cascade instead of snapping to the new total.
//
// Performance: updates the DOM text directly via a ref instead of calling
// setState on every animation frame. This avoids re-rendering the entire
// WildBountyMachine 60 times per second during the count-up, which was the
// single biggest source of jank during win sequences.
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
      const current = from + (to - from) * eased;
      if (spanRef.current) spanRef.current.textContent = current.toFixed(decimals);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, decimals]);

  return <span ref={spanRef}>{fromRef.current.toFixed(decimals)}</span>;
}