import React, { useState, useEffect, useRef } from 'react';
import GatesMultFly from './GatesMultFly';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Floating "Tumble Win" banner that rises above the reel board frame.
// Shows the tumble's win amount; if a multiplier landed, animates
// amount × multX → multiplied total, then shows the balance total, then fades.
export default function GatesTumbleWinBanner({ winHistory, balance, winFlash, containerRef, multFlyOrigins, bannerFlyOrigin }) {
  const [display, setDisplay] = useState(null);
  const lastIdx = useRef(-1);
  const timers = useRef([]);

  useEffect(() => {
    if (!winHistory || winHistory.length === 0) {
      lastIdx.current = -1;
      setDisplay(null);
      return;
    }
    const idx = winHistory.length - 1;
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    const entry = winHistory[idx];
    const amount = Number(entry.subtotal) || 0;
    const mult = Number(entry.mult) || 0;
    const bannerBefore = Number(entry.bannerBefore) || 0;
    const total = Number(entry.tumbleWin) || (mult > 0 ? amount * mult : amount);
    const balTotal = (Number(balance) || 0) + (Number(winFlash) || 0);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Compressed to fit within the 1.5s free-spin gap so the player sees the
    // win amount AND the multiplied result before the next spin starts.
    // Banner multipliers only apply when a value symbol lands this tumble.
    const subtotal = mult > 0 ? amount * mult : amount;
    if (mult > 0 && bannerBefore > 0) {
      setDisplay({ amount, mult, bannerBefore, total, subtotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, subtotal, phase: 'flyMult' }), 450));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, subtotal, phase: 'multResult' }), 1900));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, subtotal, phase: 'flyBanner' }), 2500));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, subtotal, phase: 'result' }), 3950));
      timers.current.push(setTimeout(() => setDisplay(null), 4800));
    } else if (mult > 0) {
      setDisplay({ amount, mult, bannerBefore: 0, total, subtotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore: 0, total, subtotal, phase: 'flyMult' }), 450));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore: 0, total, subtotal, phase: 'result' }), 1900));
      timers.current.push(setTimeout(() => setDisplay(null), 2900));
    } else {
      setDisplay({ amount, mult: 0, bannerBefore: 0, total: amount, subtotal: amount, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay(null), 2000));
    }
  }, [winHistory, balance, winFlash]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Persistent placeholder text shown whenever no win is being animated.
  if (!display) {
    return (
      <div className="absolute z-40 pointer-events-none"
        style={{ top: -30, left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 16,
            color: '#ffe060', letterSpacing: '0.04em',
            textShadow: '0 0 14px rgba(255,200,0,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>
            WIN UP TO 5000X
          </span>
        </div>
      </div>
    );
  }

  const label = 'TUMBLE WIN';
  // The chip flies in and SITS beside the amount (flyMult), then the multiplied
  // subtotal is shown (multResult). Then the banner chip flies in (flyBanner)
  // and the final total is shown (result).
  const value =
    display.phase === 'amount' ? fmt(display.amount) :
    display.phase === 'flyMult' ? fmt(display.amount) :
    display.phase === 'multResult' ? fmt(display.subtotal) :
    display.phase === 'flyBanner' ? fmt(display.subtotal) :
    display.phase === 'result' ? fmt(display.total) : fmt(display.total);

  const showMultFly = (display.phase === 'flyMult') && display.mult > 0;
  const showBannerFly = (display.phase === 'flyBanner') && display.bannerBefore > 0;

  return (
    <div key={winHistory?.length || 0}
      ref={containerRef}
      className="absolute z-40 pointer-events-none"
      style={{ top: -58, left: '50%', transform: 'translateX(-50%)' }}>
      <div className="relative" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'freeWinFloat 0.5s ease-out both' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 13,
          color: display.phase === 'result' ? '#fff7a0' : '#ffe060',
          letterSpacing: '0.12em',
          textShadow: '0 0 12px rgba(255,200,0,1), 0 2px 3px rgba(0,0,0,0.9)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 24,
          color: display.phase === 'result' ? '#fff8c0' : '#ffe080', marginTop: 2,
          textShadow: '0 0 16px rgba(255,200,0,1), 0 0 28px rgba(255,160,0,0.85), 0 2px 3px rgba(0,0,0,0.9)',
          WebkitTextStroke: '0.5px #5a3a0c',
          animation: display.phase === 'result' ? 'saWinPop 0.4s ease-out' : 'none' }}>
          {value}
        </span>
        {showMultFly && multFlyOrigins && multFlyOrigins.map((o, i) => (
          <GatesMultFly key={`mf-${winHistory.length}-${i}`} value={o.value} ox={o.x} oy={o.y} from="symbol" />
        ))}
        {showBannerFly && bannerFlyOrigin && (
          <GatesMultFly key={`bf-${winHistory.length}`} value={bannerFlyOrigin.value} ox={bannerFlyOrigin.x} oy={bannerFlyOrigin.y} from="banner" />
        )}
      </div>
    </div>
  );
}