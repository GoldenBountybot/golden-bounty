import { useState, useEffect, useRef } from 'react';

// Displays a number that counts up smoothly when the value increases
// (e.g. a win added to the balance). On decrease (bet placed) it snaps
// instantly so bets don't visually "uncount".
export default function AnimatedNumber({ value, duration = 750, prefix = '', suffix = '', decimals = 2, className }) {
  const [display, setDisplay] = useState(() => Number(value) || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = display;

    if (target > from) {
      cancelAnimationFrame(rafRef.current);
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setDisplay(from + (target - from) * ease(p));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else setDisplay(target);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (target < from) {
      setDisplay(target);
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = prefix + (Number.isFinite(display) ? display.toFixed(decimals) : (0).toFixed(decimals)) + suffix;
  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
}