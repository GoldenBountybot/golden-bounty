import React, { useState, useEffect, useRef } from 'react';
import GatesMultFly from './GatesMultFly';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Floating "Tumble Win" banner that rises above the reel board frame.
// Shows the tumble's win amount; if a multiplier landed, animates
// amount × multX → multiplied total, then shows the balance total, then fades.
export default function GatesTumbleWinBanner({ winHistory, balance, winFlash }) {
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
    if (mult > 0 && bannerBefore > 0) {
      setDisplay({ amount, mult, bannerBefore, total, balTotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, balTotal, phase: 'multiply' }), 450));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, balTotal, phase: 'banner' }), 1450));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore, total, balTotal, phase: 'result' }), 2450));
      timers.current.push(setTimeout(() => setDisplay(null), 3200));
    } else if (mult > 0) {
      setDisplay({ amount, mult, bannerBefore: 0, total, balTotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore: 0, total, balTotal, phase: 'multiply' }), 450));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, bannerBefore: 0, total, balTotal, phase: 'result' }), 1450));
      timers.current.push(setTimeout(() => setDisplay(null), 2400));
    } else {
      setDisplay({ amount, mult: 0, bannerBefore: 0, total: amount, balTotal, phase: 'amount' });
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
  const value =
    display.phase === 'amount' ? fmt(display.amount) :
    display.phase === 'multiply' ? `${fmt(display.amount)} × ${display.mult}X` :
    display.phase === 'banner' ? `${fmt(display.amount)} × ${display.mult}X × ${display.bannerBefore}X` :
    display.phase === 'result' ? fmt(display.total) :
    display.phase === 'balance' ? (display.mult > 0 || display.bannerBefore > 0
      ? `${fmt(display.total)}`
      : fmt(display.total)) : '';

  const showMultFly = display.phase === 'multiply' && display.mult > 0;
  const showBannerFly = display.phase === 'banner' && display.bannerBefore > 0;

  return (
    <div key={winHistory?.length || 0}
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
        {showMultFly && (
          <GatesMultFly key={`mf-${winHistory.length}`} value={display.mult} ox={0} oy={110} from="symbol" />
        )}
        {showBannerFly && (
          <GatesMultFly key={`bf-${winHistory.length}`} value={display.bannerBefore} ox={130} oy={90} from="banner" />
        )}
      </div>
    </div>
  );
}