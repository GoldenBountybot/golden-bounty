import React, { useState, useEffect, useRef } from 'react';

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
    const total = mult > 0 ? amount * mult : amount;
    const balTotal = (Number(balance) || 0) + (Number(winFlash) || 0);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (mult > 0) {
      setDisplay({ amount, mult, total, balTotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, total, balTotal, phase: 'multiply' }), 650));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, total, balTotal, phase: 'result' }), 1500));
      timers.current.push(setTimeout(() => setDisplay({ amount, mult, total, balTotal, phase: 'balance' }), 2300));
      timers.current.push(setTimeout(() => setDisplay(null), 3300));
    } else {
      setDisplay({ amount, mult: 0, total: amount, balTotal, phase: 'amount' });
      timers.current.push(setTimeout(() => setDisplay({ amount, mult: 0, total: amount, balTotal, phase: 'balance' }), 850));
      timers.current.push(setTimeout(() => setDisplay(null), 1900));
    }
  }, [winHistory, balance, winFlash]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  if (!display) return null;

  const label = 'TUMBLE WIN';
  const value =
    display.phase === 'amount' ? fmt(display.amount) :
    display.phase === 'multiply' ? `${fmt(display.amount)} × ${display.mult}X` :
    display.phase === 'result' ? fmt(display.total) :
    display.phase === 'balance' ? (display.mult > 0 ? `${fmt(display.total)} × ${display.mult}X` : fmt(display.total)) : '';

  return (
    <div key={winHistory?.length || 0}
      className="absolute z-40 pointer-events-none"
      style={{ top: -58, left: '50%', transform: 'translateX(-50%)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'freeWinFloat 0.5s ease-out both' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 12,
          color: display.phase === 'balance' ? '#b0e060' : '#ffe060',
          letterSpacing: '0.1em',
          textShadow: '0 0 10px rgba(255,200,0,0.9), 0 1px 2px rgba(0,0,0,0.85)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 18,
          color: '#ffe080', marginTop: 1,
          textShadow: '0 0 12px rgba(255,200,0,0.95), 0 1px 2px rgba(0,0,0,0.85)',
          animation: display.phase === 'result' ? 'saWinPop 0.4s ease-out' : 'none' }}>
          {value}
        </span>
      </div>
    </div>
  );
}