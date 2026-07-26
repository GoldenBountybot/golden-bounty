import React, { useState, useEffect, useRef } from 'react';

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

// Floating "TUMBLE WIN" overlay shown above the reel board on each winning
// tumble. The label floats up, the win amount is shown; if a multiplier is
// present the amount is multiplied (×N animates in), then the total flies
// down toward the balance chip and fades.
export default function GatesTumbleWin({ data, turbo }) {
  const [phase, setPhase] = useState(0); // 0 hidden · 1 float up · 2 mult · 3 fly
  const [win, setWin] = useState(0);
  const [mult, setMult] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    if (!data || data.win <= 0) { setPhase(0); return; }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setWin(data.win);
    setMult(0);
    setPhase(1);
    const t1 = turbo ? 380 : 580;
    const t2 = turbo ? 820 : 1250;
    const t3 = turbo ? 1400 : 2100;
    if (data.mult > 0) {
      timers.current.push(setTimeout(() => { setMult(data.mult); setPhase(2); }, t1));
    }
    timers.current.push(setTimeout(() => setPhase(3), t2));
    timers.current.push(setTimeout(() => setPhase(0), t3));
    return () => { timers.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && data.key]);

  if (!phase) return null;
  const total = mult > 0 ? win * mult : win;
  const flying = phase === 3;

  return (
    <div className="absolute z-40 pointer-events-none"
      style={{
        left: '50%',
        top: -30,
        transform: `translateX(-50%) translateY(${flying ? 300 : 0}px) scale(${flying ? 0.55 : 1})`,
        opacity: flying ? 0 : 1,
        transition: flying ? `transform ${turbo ? 0.5 : 0.7}s ease-in, opacity ${turbo ? 0.5 : 0.7}s ease-in` : 'none',
        textAlign: 'center',
        willChange: 'transform, opacity',
      }}>
      <div style={{
        animation: phase === 1 ? `gatesTumbleFloat ${turbo ? 0.3 : 0.45}s ease-out both` : 'none',
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        padding: '4px 16px', borderRadius: 16,
        background: 'linear-gradient(to bottom, rgba(50,28,10,0.95), rgba(20,10,5,0.95))',
        border: '2px solid rgba(255,210,80,0.95)',
        boxShadow: '0 0 18px rgba(255,200,60,0.75), 0 0 34px rgba(255,180,40,0.4), 0 4px 14px rgba(0,0,0,0.65)',
      }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 900, color: '#ffe080',
          letterSpacing: '0.12em', textShadow: '0 0 8px rgba(255,200,0,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>
          TUMBLE WIN
        </span>
        <span key={mult} style={{ fontFamily: 'Georgia,serif', fontSize: 19, fontWeight: 900, color: '#fff4c0',
          textShadow: '0 0 10px rgba(255,220,100,1), 0 1px 2px rgba(0,0,0,0.8)',
          animation: mult > 0 ? `gatesMultReveal ${turbo ? 0.3 : 0.45}s ease-out both` : 'none' }}>
          {fmt(total)}
        </span>
        {mult > 0 && (
          <span key={`m${mult}`} style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 900, color: '#ff9a30',
            textShadow: '0 0 10px rgba(255,130,0,1), 0 1px 2px rgba(0,0,0,0.8)',
            animation: `gatesMultReveal ${turbo ? 0.3 : 0.45}s ease-out both` }}>
            × {mult}
          </span>
        )}
      </div>
    </div>
  );
}