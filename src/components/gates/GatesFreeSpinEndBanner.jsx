import React, { useState, useEffect, useRef } from 'react';
import { playCountUp } from '@/lib/gatesSound';

// Floating "FREE SPINS COMPLETE" overlay banner shown when the entire free
// spins round ends. Shows the total win accumulated across all free spins,
// counts up from 0 → amount with a premium feel, then floats up and fades out.
export default function GatesFreeSpinEndBanner({ amount, onDone }) {
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
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(target * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCount(target);
        timersRef.current.push(setTimeout(() => setLeaving(true), 1600));
        timersRef.current.push(setTimeout(() => onDone?.(), 2800));
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
        style={{ background: 'rgba(0,0,0,0.6)', animation: leaving ? 'wbGoldFlash 0.8s ease-out reverse both' : 'dashFadeIn 300ms ease both' }} />
      {/* banner */}
      <div className="relative flex flex-col items-center"
        style={{ animation: leaving
          ? 'gatesBannerFloat 1.0s ease-in forwards'
          : 'gatesBannerFloat 0.6s cubic-bezier(0.22,0.7,0.32,1) both' }}>
        {/* ornate banner image with centered text overlay */}
        <div style={{
          position: 'relative',
          width: 'min(92vw, 520px)',
          aspectRatio: '2 / 1',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 40px rgba(200,136,10,0.4)',
          textAlign: 'center',
        }}>
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d5525b830_file_00000000e7fc8211826f062956600ef9.png"
            alt="Free Spins Complete"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div style={{
              fontFamily: 'Cinzel, Georgia, serif', fontWeight: 900, fontSize: 'clamp(16px, 4.2vw, 26px)',
              color: '#ffe066', letterSpacing: '0.1em',
              textShadow: '0 0 14px rgba(255,200,0,0.95), 0 0 26px rgba(255,160,0,0.7), 0 2px 5px rgba(0,0,0,0.95)',
            }}>
              FREE SPINS COMPLETE
            </div>
            <div style={{
              fontFamily: 'Cinzel, Georgia, serif', fontSize: 'clamp(10px, 2.6vw, 13px)', fontWeight: 700,
              color: '#e8c878', letterSpacing: '0.18em', marginTop: 6,
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            }}>
              TOTAL WIN
            </div>
            <div style={{ marginTop: 8, position: 'relative' }}>
              <span style={{
                fontFamily: 'Cinzel, Georgia, serif', fontWeight: 900, fontSize: 'clamp(28px, 7.5vw, 44px)',
                color: '#ffe066', letterSpacing: '0.04em',
                textShadow: '0 0 16px rgba(255,200,0,1), 0 0 30px rgba(255,160,0,0.85), 0 2px 5px rgba(0,0,0,0.95)',
                animation: 'winCountPop 0.5s ease-out',
                display: 'inline-block',
              }}>
                {fmt(count)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}