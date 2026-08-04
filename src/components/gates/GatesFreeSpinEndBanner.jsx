import React, { useState, useEffect, useRef } from 'react';

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
        {/* ornate gold frame */}
        <div style={{
          padding: '18px 40px 14px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #3a1052, #1a0a38 60%, #3a1052)',
          border: '3px solid #d4a93a',
          boxShadow: '0 0 0 1px #7a4a08, 0 0 0 4px #f8d840, 0 0 0 5px #7a4a08, 0 8px 30px rgba(0,0,0,0.8), 0 0 40px rgba(200,136,10,0.4)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '22px',
            color: '#ffe060', letterSpacing: '0.08em',
            textShadow: '0 0 14px rgba(255,200,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
          }}>
            FREE SPINS COMPLETE
          </div>
          <div style={{
            fontFamily: 'Georgia,serif', fontSize: '11px', fontWeight: 700,
            color: '#c8a040', letterSpacing: '0.12em', marginTop: 4,
          }}>
            TOTAL WIN
          </div>
          <div style={{ marginTop: 6, position: 'relative' }}>
            <span style={{
              fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '34px',
              color: '#ffe060', letterSpacing: '0.04em',
              textShadow: '0 0 16px rgba(255,200,0,1), 0 0 28px rgba(255,160,0,0.8), 0 2px 4px rgba(0,0,0,0.9)',
              animation: 'winCountPop 0.5s ease-out',
              display: 'inline-block',
            }}>
              {fmt(count)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}