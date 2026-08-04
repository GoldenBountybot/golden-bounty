import React, { useState, useEffect, useRef } from 'react';
import { playCountUp } from '@/lib/gatesSound';

const IMAGES = {
  super: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/422880cd4_file_0000000057d881fbaa643e8f2dd979ce.png',
  mega: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b90df1f5b_file_00000000233881faa2d49279db01c3b7.png',
};

// Floating SUPER WIN / MEGA WIN overlay banner.
// Shows the ornate image, then counts the total win amount up from 0 → amount
// with a premium luxury feel, then floats up and fades out.
export default function GatesBigWinBanner({ variant, amount, onDone }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const rafRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    const target = Number(amount) || 0;
    const duration = 2600; // count-up duration
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic for a premium decelerating count
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(target * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCount(target);
        // hold, then float up and fade
        timersRef.current.push(setTimeout(() => setLeaving(true), 1400));
        timersRef.current.push(setTimeout(() => onDone?.(), 2600));
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    playCountUp(duration);
    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  }, [amount, onDone]);

  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* dark backdrop */}
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', animation: leaving ? 'wbGoldFlash 0.8s ease-out reverse both' : 'dashFadeIn 300ms ease both' }} />
      {/* banner image + count-up amount */}
      <div className="relative flex flex-col items-center"
        style={{ animation: leaving
          ? 'gatesBannerFloat 1.0s ease-in forwards'
          : 'gatesBannerFloat 0.6s cubic-bezier(0.22,0.7,0.32,1) both' }}>
        <img src={IMAGES[variant]} alt={variant === 'mega' ? 'MEGA WIN' : 'SUPER WIN'}
          style={{ width: 'clamp(260px, 88vw, 380px)', height: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 0 24px rgba(255,200,40,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }} />
        {/* count-up win amount — sits just below the banner image */}
        <div style={{ marginTop: -18, position: 'relative' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '30px',
            color: '#ffe060', letterSpacing: '0.04em',
            textShadow: '0 0 16px rgba(255,200,0,1), 0 0 28px rgba(255,160,0,0.8), 0 2px 4px rgba(0,0,0,0.9)',
            animation: 'winCountPop 0.5s ease-out' }}>
            {fmt(count)}
          </span>
        </div>
      </div>
    </div>
  );
}